'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

type RawSchedule = {
  date?: string
  dayOfWeek?: number
  startPeriod?: number
  endPeriod?: number
  room?: string
}

type NormalizedSchedule = {
  date: string | null
  dayOfWeek: number | null
  startPeriod: number
  endPeriod: number
  room: string | null
}

function parseSchedule(raw: unknown): NormalizedSchedule[] {
  if (!raw) return []

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item: RawSchedule) => {
        const start = Number(item.startPeriod)
        const end = Number(item.endPeriod)
        const day = item.dayOfWeek != null ? Number(item.dayOfWeek) : null
        const date = item.date ? String(item.date) : null

        if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return null
        if (!date && (day == null || !Number.isFinite(day))) return null

        return {
          date,
          dayOfWeek: date ? null : day,
          startPeriod: start,
          endPeriod: end,
          room: item.room ? String(item.room).trim() : null
        }
      })
      .filter((item): item is NormalizedSchedule => item !== null)
  } catch {
    return []
  }
}

function periodsOverlap(a: NormalizedSchedule, b: NormalizedSchedule) {
  return a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod
}

function sameTimeSlot(a: NormalizedSchedule, b: NormalizedSchedule) {
  if (a.date && b.date) {
    return a.date === b.date && periodsOverlap(a, b)
  }
  if (!a.date && !b.date && a.dayOfWeek != null && b.dayOfWeek != null) {
    return a.dayOfWeek === b.dayOfWeek && periodsOverlap(a, b)
  }
  return false
}

function buildConflictMessage(kind: 'LECTURER' | 'STUDENT_CLASS' | 'ROOM', byClass: any) {
  const course = byClass?.courses?.code ? `${byClass.courses.code}` : 'N/A'
  const semester = byClass?.semester || 'N/A'
  if (kind === 'LECTURER') {
    return `Trùng lịch giảng viên với lớp học phần khác (${course}, ${semester}).`
  }
  if (kind === 'STUDENT_CLASS') {
    return `Trùng lịch lớp sinh viên với môn khác (${course}, ${semester}).`
  }
  return `Trùng lịch phòng học với lớp khác (${course}, ${semester}).`
}

async function validateScheduleConflicts(input: {
  lecturerId: string
  studentClassId: string | null
  schedule: string | null
  semester: string
  ignoreClassIds?: string[]
}) {
  const normalized = parseSchedule(input.schedule)
  if (normalized.length === 0) return null

  const { data: peerClasses, error } = await supabaseAdmin
    .from('classes')
    .select('id, semester, lecturer_id, student_class_id, schedule, courses(code)')
    .eq('semester', input.semester)

  if (error) {
    return { error: `Không thể kiểm tra trùng lịch: ${error.message}` }
  }

  const ignored = new Set(input.ignoreClassIds || [])
  const candidates = (peerClasses || []).filter(c => !ignored.has(c.id))

  for (const candidate of candidates) {
    const candidateSchedule = parseSchedule(candidate.schedule)
    if (candidateSchedule.length === 0) continue

    for (const current of normalized) {
      for (const existing of candidateSchedule) {
        if (!sameTimeSlot(current, existing)) continue

        if (candidate.lecturer_id === input.lecturerId) {
          return { error: buildConflictMessage('LECTURER', candidate) }
        }

        if (input.studentClassId && candidate.student_class_id === input.studentClassId) {
          return { error: buildConflictMessage('STUDENT_CLASS', candidate) }
        }

        if (current.room && existing.room && current.room === existing.room) {
          return { error: buildConflictMessage('ROOM', candidate) }
        }
      }
    }
  }

  return null
}

export async function createClass(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const semester = formData.get('semester') as string
  const lecturerIds = formData.getAll('lecturerId') as string[] // Hỗ trợ lấy Array từ Checkbox UI

  if (!courseId || !semester || lecturerIds.length === 0) {
    return { error: 'Vui lòng điền đủ Môn, Học kỳ và check chọn ít nhất một Giảng viên!' }
  }

  const inserts = []
  for (const lId of lecturerIds) {
    const studentClassId = (formData.get(`studentClassId_${lId}`) as string) || null
    const schedule = (formData.get(`schedule_${lId}`) as string) || null
    const conflict = await validateScheduleConflicts({
      lecturerId: lId,
      studentClassId,
      schedule,
      semester
    })

    if (conflict?.error) return conflict

    inserts.push({
      course_id: courseId,
      lecturer_id: lId,
      semester,
      student_class_id: studentClassId,
      schedule
    })
  }

  const { error } = await supabaseAdmin.from('classes').insert(inserts)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function createClassByStudentClasses(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const semester = formData.get('semester') as string
  const lecturerIds = formData.getAll('lecturerId') as string[]
  const studentClassIds = formData.getAll('studentClassId') as string[]

  if (!courseId || !semester || lecturerIds.length === 0 || studentClassIds.length === 0) {
    return { error: 'Vui lòng chọn môn, học kỳ, ít nhất một giảng viên và ít nhất một lớp sinh viên.' }
  }

  const inserts: Array<{
    course_id: string
    lecturer_id: string
    semester: string
    student_class_id: string
    schedule: string | null
  }> = []

  const { data: templateRows, error: templateErr } = await supabaseAdmin
    .from('classes')
    .select('lecturer_id, schedule')
    .eq('course_id', courseId)
    .is('student_class_id', null)

  if (templateErr) return { error: templateErr.message }
  const templateMap = new Map((templateRows || []).map(row => [row.lecturer_id, row.schedule || null]))

  for (const lecturerId of lecturerIds) {
    if (!templateMap.has(lecturerId)) {
      return { error: 'Giảng viên chưa được gán vào môn học ở mục Quản lý Môn học.' }
    }
    const schedule = (templateMap.get(lecturerId) as string | null | undefined) || null
    for (const studentClassId of studentClassIds) {
      const conflict = await validateScheduleConflicts({
        lecturerId,
        studentClassId,
        schedule,
        semester
      })
      if (conflict?.error) {
        return {
          error: `${conflict.error} (GV: ${lecturerId}, Lớp: ${studentClassId})`
        }
      }

      inserts.push({
        course_id: courseId,
        lecturer_id: lecturerId,
        semester,
        student_class_id: studentClassId,
        schedule
      })
    }
  }

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('classes')
    .select('course_id, semester, lecturer_id, student_class_id')
    .eq('course_id', courseId)
    .eq('semester', semester)
    .in('lecturer_id', lecturerIds)
    .in('student_class_id', studentClassIds)

  if (existingErr) return { error: existingErr.message }

  const existsKey = new Set(
    (existing || []).map(
      row => `${row.course_id}|${row.semester}|${row.lecturer_id}|${row.student_class_id || ''}`
    )
  )
  const dedupInserts = inserts.filter(
    row => !existsKey.has(`${row.course_id}|${row.semester}|${row.lecturer_id}|${row.student_class_id}`)
  )

  if (dedupInserts.length === 0) {
    return { error: 'Các phân công này đã tồn tại, không có dữ liệu mới để thêm.' }
  }

  const { error } = await supabaseAdmin.from('classes').insert(dedupInserts)
  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function createClassSubjectsSemester(formData: FormData) {
  const semester = formData.get('semester') as string
  const studentClassIds = formData.getAll('studentClassId') as string[]
  const courseIds = formData.getAll('courseId') as string[]

  if (!semester || studentClassIds.length === 0 || courseIds.length === 0) {
    return { error: 'Vui lòng chọn Học kỳ, ít nhất một Lớp và ít nhất một Môn.' }
  }

  const inserts: { student_class_id: string; course_id: string; semester: string }[] = []
  for (const scId of studentClassIds) {
    for (const cId of courseIds) {
      inserts.push({ student_class_id: scId, course_id: cId, semester })
    }
  }

  const { error } = await supabaseAdmin
    .from('class_subjects')
    .upsert(inserts, { onConflict: 'student_class_id,course_id,semester', ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  return { success: true }
}

export async function assignLecturersForClassSubjects(formData: FormData) {
  const studentClassId = formData.get('studentClassId') as string
  const semester = formData.get('semester') as string

  if (!studentClassId || !semester) {
    return { error: 'Vui lòng chọn Lớp và Học kỳ.' }
  }

  const { data: subjects, error: subjErr } = await supabaseAdmin
    .from('class_subjects')
    .select('course_id')
    .eq('student_class_id', studentClassId)
    .eq('semester', semester)

  if (subjErr) return { error: subjErr.message }
  const safeSubjects = subjects || []
  if (safeSubjects.length === 0) {
    return { error: 'Lớp này chưa được gán môn học cho học kỳ đã chọn.' }
  }

  const courseIds = safeSubjects.map(s => s.course_id)
  for (const courseId of courseIds) {
    const lecturerIdRaw = formData.get(`lecturer_${courseId}`)
    const lecturerId = lecturerIdRaw ? String(lecturerIdRaw) : ''
    const lecturerIdOrNull = lecturerId ? lecturerId : null

    const { error } = await supabaseAdmin
      .from('class_subjects')
      .update({ lecturer_id: lecturerIdOrNull })
      .eq('student_class_id', studentClassId)
      .eq('semester', semester)
      .eq('course_id', courseId)

    if (error) return { error: error.message }
  }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function saveClassWeeklySchedule(formData: FormData) {
  const studentClassId = formData.get('studentClassId') as string
  const semester = formData.get('semester') as string

  if (!studentClassId || !semester) {
    return { error: 'Vui lòng chọn Lớp và Học kỳ.' }
  }

  const { data: subjects, error: subjErr } = await supabaseAdmin
    .from('class_subjects')
    .select('id, course_id, lecturer_id, schedule')
    .eq('student_class_id', studentClassId)
    .eq('semester', semester)

  if (subjErr) return { error: subjErr.message }
  const safeSubjects = subjects || []
  if (safeSubjects.length === 0) return { error: 'Lớp này chưa được gán môn học cho học kỳ đã chọn.' }

  const courseIds = safeSubjects.map(s => s.course_id)

  const { data: existingClasses, error: existErr } = await supabaseAdmin
    .from('classes')
    .select('id, course_id')
    .eq('semester', semester)
    .eq('student_class_id', studentClassId)
    .in('course_id', courseIds)

  if (existErr) return { error: existErr.message }
  const existing = existingClasses || []

  for (const subj of safeSubjects) {
    const courseId = subj.course_id as string
    const scheduleRaw = formData.get(`schedule_${courseId}`)
    const schedule = scheduleRaw ? String(scheduleRaw) : ''
    const scheduleOrNull = schedule ? schedule : null

    // If schedule is set, lecturer must be selected at step 2
    if (scheduleOrNull && !subj.lecturer_id) {
      return { error: 'Bạn cần chọn giảng viên cho tất cả môn trước khi xếp lịch.' }
    }

    // Save schedule on class_subjects
    const { error: upErr } = await supabaseAdmin
      .from('class_subjects')
      .update({ schedule: scheduleOrNull })
      .eq('id', subj.id)
    if (upErr) return { error: upErr.message }

    const existingClass = existing.find(c => c.course_id === courseId)

    // If schedule cleared: remove classes row so it doesn't appear in portal
    if (!scheduleOrNull) {
      if (existingClass) {
        const { error } = await supabaseAdmin.from('classes').delete().eq('id', existingClass.id)
        if (error) return { error: error.message }
      }
      continue
    }

    const lecturerId = String(subj.lecturer_id)

    const conflict = await validateScheduleConflicts({
      lecturerId,
      studentClassId,
      schedule: scheduleOrNull,
      semester,
      ignoreClassIds: existingClass ? [existingClass.id] : []
    })
    if (conflict?.error) return conflict

    if (existingClass) {
      const { error } = await supabaseAdmin
        .from('classes')
        .update({ lecturer_id: lecturerId, schedule: scheduleOrNull })
        .eq('id', existingClass.id)
      if (error) return { error: error.message }
    } else {
      const { error } = await supabaseAdmin.from('classes').insert({
        course_id: courseId,
        lecturer_id: lecturerId,
        semester,
        student_class_id: studentClassId,
        schedule: scheduleOrNull
      })
      if (error) return { error: error.message }
    }
  }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  revalidatePath('/student/schedule')
  return { success: true }
}

export async function deleteClassSemesterPlan(studentClassId: string, semester: string) {
  if (!studentClassId || !semester) return { error: 'Thiếu lớp hoặc học kỳ.' }

  const { error: csErr } = await supabaseAdmin
    .from('class_subjects')
    .delete()
    .eq('student_class_id', studentClassId)
    .eq('semester', semester)

  if (csErr) return { error: csErr.message }

  const { error: cErr } = await supabaseAdmin
    .from('classes')
    .delete()
    .eq('student_class_id', studentClassId)
    .eq('semester', semester)

  if (cErr) return { error: cErr.message }

  revalidatePath('/admin/classes')
  revalidatePath('/student/schedule')
  return { success: true }
}

export async function upsertCourseLecturerTemplates(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const semester = formData.get('semester') as string
  const lecturerIds = formData.getAll('lecturerId') as string[]

  if (!courseId || !semester || lecturerIds.length === 0) {
    return { error: 'Vui lòng chọn môn, học kỳ và ít nhất một giảng viên.' }
  }

  const { data: oldRows, error: oldErr } = await supabaseAdmin
    .from('classes')
    .select('id, lecturer_id')
    .eq('course_id', courseId)
    .eq('semester', semester)
    .is('student_class_id', null)

  if (oldErr) return { error: oldErr.message }

  const oldByLecturer = new Map((oldRows || []).map(row => [row.lecturer_id, row.id]))
  const selected = new Set(lecturerIds)

  const toRemove = (oldRows || []).filter(row => !selected.has(row.lecturer_id)).map(row => row.id)
  if (toRemove.length > 0) {
    const { error } = await supabaseAdmin.from('classes').delete().in('id', toRemove)
    if (error) return { error: error.message }
  }

  for (const lecturerId of lecturerIds) {
    const schedule = (formData.get(`schedule_${lecturerId}`) as string) || null
    const existedId = oldByLecturer.get(lecturerId)
    if (existedId) {
      const { error } = await supabaseAdmin
        .from('classes')
        .update({ schedule })
        .eq('id', existedId)
      if (error) return { error: error.message }
    } else {
      const { error } = await supabaseAdmin.from('classes').insert({
        course_id: courseId,
        semester,
        lecturer_id: lecturerId,
        student_class_id: null,
        schedule
      })
      if (error) return { error: error.message }
    }
  }

  revalidatePath('/admin/courses')
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function deleteClass(id: string) {
  const { error } = await supabaseAdmin.from('classes').delete().eq('id', id)
  if (error) return { error: error.message }
  
  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  return { success: true }
}

import { redirect } from 'next/navigation'

export async function updateClass(formData: FormData) {
  const id = formData.get('id') as string
  const courseId = formData.get('courseId') as string
  const lecturerId = formData.get('lecturerId') as string
  const semester = formData.get('semester') as string

  if (!courseId || !lecturerId || !semester) {
    return { error: 'Vui lòng điền đủ thông tin bắt buộc!' }
  }

  const { error } = await supabaseAdmin.from('classes').update({
    course_id: courseId,
    lecturer_id: lecturerId,
    semester
  }).eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  redirect('/admin/classes')
}

export async function deleteMultipleClasses(ids: string[]) {
  const { error } = await supabaseAdmin.from('classes').delete().in('id', ids)
  if (error) return { error: error.message }
  
  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function updateClassGroup(courseId: string, semester: string, assignments: { lecturerId: string, studentClassId: string | null, schedule: string | null }[]) {
  const { data: oldClasses } = await supabaseAdmin.from('classes').select('*').eq('course_id', courseId).eq('semester', semester)
  const safeOldClasses = oldClasses || []
  const oldLecturerIds = safeOldClasses.map(c => c.lecturer_id)
  const newLecturerIds = assignments.map(a => a.lecturerId)

  const toAdd = assignments.filter(a => !oldLecturerIds.includes(a.lecturerId))
  const toRemoveIds = safeOldClasses.filter(c => !newLecturerIds.includes(c.lecturer_id)).map(c => c.id)
  const toUpdate = assignments.filter(a => oldLecturerIds.includes(a.lecturerId))

  if (toRemoveIds.length > 0) {
    const { error } = await supabaseAdmin.from('classes').delete().in('id', toRemoveIds)
    if (error) return { error: error.message }
  }

  if (toAdd.length > 0) {
    const inserts = []
    for (const a of toAdd) {
      const conflict = await validateScheduleConflicts({
        lecturerId: a.lecturerId,
        studentClassId: a.studentClassId || null,
        schedule: a.schedule || null,
        semester
      })
      if (conflict?.error) return conflict

      inserts.push({ course_id: courseId, lecturer_id: a.lecturerId, semester, student_class_id: a.studentClassId || null, schedule: a.schedule || null })
    }
    const { error } = await supabaseAdmin.from('classes').insert(inserts)
    if (error) return { error: error.message }
  }

  // Cập nhật lại class_name cho các giảng viên giữ nguyên
  for (const a of toUpdate) {
    const existingClass = safeOldClasses.find(c => c.lecturer_id === a.lecturerId)
    if (existingClass) {
      const conflict = await validateScheduleConflicts({
        lecturerId: a.lecturerId,
        studentClassId: a.studentClassId || null,
        schedule: a.schedule || null,
        semester,
        ignoreClassIds: [existingClass.id]
      })
      if (conflict?.error) return conflict
    }

    const { error } = await supabaseAdmin
      .from('classes')
      .update({ student_class_id: a.studentClassId || null, schedule: a.schedule || null })
      .eq('course_id', courseId)
      .eq('semester', semester)
      .eq('lecturer_id', a.lecturerId)

    if (error) return { error: error.message }
  }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/courses')
  return { success: true }
}

