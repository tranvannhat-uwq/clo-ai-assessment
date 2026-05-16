'use client'

import { useEffect, useMemo, useState } from 'react'
import { saveClassWeeklySchedule } from '@/actions/admin/classes'
import styles from '../users/page.module.css'

type ScheduleItem =
  | { dayOfWeek: number; startPeriod: number; endPeriod: number; room?: string; fromDate?: string; toDate?: string }
  | { date: string; startPeriod: number; endPeriod: number; room?: string }

function safeParseSchedule(raw: any): ScheduleItem[] {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function periodsOverlap(a: { startPeriod: number; endPeriod: number }, b: { startPeriod: number; endPeriod: number }) {
  return a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod
}

export function WeeklyScheduleForm({
  studentClasses,
  classSubjects,
  courses,
  defaultStudentClassId,
  defaultSemester
}: {
  studentClasses: any[]
  classSubjects: any[]
  courses: any[]
  defaultStudentClassId?: string
  defaultSemester?: string
}) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(defaultStudentClassId || '')
  const [semester, setSemester] = useState(defaultSemester || '')
  const [scheduleState, setScheduleState] = useState<Record<string, ScheduleItem[]>>({})
  const [previewBaseDate, setPreviewBaseDate] = useState(new Date())

  const availableSemesters = useMemo(
    () =>
      Array.from(
        new Set(
          classSubjects
            .filter((s: any) => !selectedStudentClassId || s.student_class_id === selectedStudentClassId)
            .map((s: any) => s.semester)
        )
      ),
    [classSubjects, selectedStudentClassId]
  )

  const subjectsForClass = useMemo(() => {
    const rows = classSubjects.filter(
      (s: any) => s.student_class_id === selectedStudentClassId && s.semester === semester
    )
    return rows.map((s: any) => ({
      ...s,
      course: courses.find(c => c.id === s.course_id)
    }))
  }, [classSubjects, selectedStudentClassId, semester, courses])

  useEffect(() => {
    const initial: Record<string, ScheduleItem[]> = {}
    for (const s of subjectsForClass) {
      initial[s.course_id] = safeParseSchedule(s.schedule)
    }
    setScheduleState(initial)
  }, [subjectsForClass])

  const dayLabels: Record<number, string> = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' }
  const periods = Array.from({ length: 10 }, (_, i) => i + 1)

  const previewDates = useMemo(() => {
    const d = new Date(previewBaseDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(d.setDate(diff))
    
    const dates: Record<number, string> = {}
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday)
      cur.setDate(monday.getDate() + i)
      // JS getDay(): 0 = Sun, 1 = Mon ...
      // Our dayOfWeek: 2 = Mon, ..., 8 = Sun
      const dayOfWeek = cur.getDay() === 0 ? 8 : cur.getDay() + 1
      dates[dayOfWeek] = cur.toISOString().split('T')[0]
    }
    return dates
  }, [previewBaseDate])

  const weeklyPreview = useMemo(() => {
    const grid: Record<number, Record<number, string[]>> = {}
    for (const day of [2, 3, 4, 5, 6, 7, 8]) {
      grid[day] = {}
      for (const p of periods) grid[day][p] = []
    }
    for (const subj of subjectsForClass) {
      const courseCode = subj.course?.code || 'Môn'
      const items = scheduleState[subj.course_id] || []
      for (const it of items) {
        if ('dayOfWeek' in it) {
          const currentDayDate = previewDates[it.dayOfWeek]
          if (it.fromDate && currentDayDate < it.fromDate) continue
          if (it.toDate && currentDayDate > it.toDate) continue
          
          for (let p = it.startPeriod; p <= it.endPeriod; p++) {
            if (grid[it.dayOfWeek]?.[p]) grid[it.dayOfWeek][p].push(courseCode)
          }
        } else if ('date' in it) {
          // Find if this date is in the current preview week
          const dayOfWeekEntry = Object.entries(previewDates).find(([_, dateStr]) => dateStr === it.date)
          if (dayOfWeekEntry) {
            const dayOfWeek = Number(dayOfWeekEntry[0])
            for (let p = it.startPeriod; p <= it.endPeriod; p++) {
              if (grid[dayOfWeek]?.[p]) grid[dayOfWeek][p].push(courseCode)
            }
          }
        }
      }
    }
    return grid
  }, [subjectsForClass, scheduleState, previewDates])

  const localConflicts = useMemo(() => {
    // local-only conflicts inside this class schedule (helps before server-check)
    const conflicts: string[] = []
    const all: Array<{ courseId: string; courseCode: string; item: ScheduleItem }> = []
    for (const subj of subjectsForClass) {
      const code = subj.course?.code || subj.course_id
      for (const item of scheduleState[subj.course_id] || []) {
        all.push({ courseId: subj.course_id, courseCode: code, item })
      }
    }
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i].item
        const b = all[j].item
        if ('dayOfWeek' in a && 'dayOfWeek' in b && a.dayOfWeek === b.dayOfWeek && periodsOverlap(a, b)) {
          conflicts.push(`Trùng lịch trong lớp: ${all[i].courseCode} và ${all[j].courseCode} (${dayLabels[a.dayOfWeek]} ${a.startPeriod}-${a.endPeriod})`)
        }
        if ('date' in a && 'date' in b && a.date === b.date && periodsOverlap(a, b)) {
          conflicts.push(`Trùng lịch theo ngày: ${all[i].courseCode} và ${all[j].courseCode} (${a.date} ${a.startPeriod}-${a.endPeriod})`)
        }
      }
    }
    return Array.from(new Set(conflicts))
  }, [subjectsForClass, scheduleState])

  const addWeeklyItem = (courseId: string) => {
    const cur = scheduleState[courseId] || []
    setScheduleState({
      ...scheduleState,
      [courseId]: [...cur, { dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: '' }]
    })
  }

  const addDateItem = (courseId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const cur = scheduleState[courseId] || []
    setScheduleState({
      ...scheduleState,
      [courseId]: [...cur, { date: today, startPeriod: 1, endPeriod: 3, room: '' }]
    })
  }

  const updateItem = (courseId: string, idx: number, patch: Partial<any>) => {
    const cur = [...(scheduleState[courseId] || [])]
    cur[idx] = { ...cur[idx], ...patch }
    setScheduleState({ ...scheduleState, [courseId]: cur })
  }

  const removeItem = (courseId: string, idx: number) => {
    const cur = (scheduleState[courseId] || []).filter((_, i) => i !== idx)
    setScheduleState({ ...scheduleState, [courseId]: cur })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.set('studentClassId', selectedStudentClassId)
      fd.set('semester', semester)
      for (const subj of subjectsForClass) {
        const items = scheduleState[subj.course_id] || []
        fd.set(`schedule_${subj.course_id}`, items.length ? JSON.stringify(items) : '')
      }
      const res = await saveClassWeeklySchedule(fd)
      if (res && 'error' in res && res.error) setError(res.error)
      else window.location.reload()
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu thời khóa biểu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div style={{ color: '#ef4444', marginBottom: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {localConflicts.length > 0 && (
        <div style={{ color: '#92400e', marginBottom: '0.5rem', padding: '0.75rem', background: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a', fontWeight: 500, fontSize: '0.9rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Cảnh báo trùng trong lớp (chưa tính trùng giảng viên với lớp khác)</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {localConflicts.slice(0, 6).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.inputGroup}>
        <label>Chọn Lớp hành chính</label>
        <select value={selectedStudentClassId} onChange={e => setSelectedStudentClassId(e.target.value)} required>
          <option value="">-- Chọn lớp --</option>
          {studentClasses?.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.cohort})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Học kỳ</label>
        <select value={semester} onChange={e => setSemester(e.target.value)} required>
          <option value="">-- Chọn học kỳ --</option>
          {availableSemesters.map((sem: any) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      {selectedStudentClassId && semester && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1rem', alignItems: 'start' }}>
          <div className={styles.inputGroup}>
            <label>Xếp lịch theo môn (lịch tuần + lịch theo ngày)</label>
            <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '1rem', maxHeight: '520px', overflowY: 'auto' }}>
              {subjectsForClass.map((subj: any) => {
                const items = scheduleState[subj.course_id] || []
                const hasLecturer = !!subj.lecturer_id
                return (
                  <div key={subj.id} style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px dashed #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {subj.course?.code} - {subj.course?.name}
                      </div>
                      {!hasLecturer && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Chưa chọn giảng viên</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => addWeeklyItem(subj.course_id)} style={{ padding: '0.45rem 0.6rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.35rem', cursor: 'pointer' }}>
                        + Thêm lịch tuần
                      </button>
                      <button type="button" onClick={() => addDateItem(subj.course_id)} style={{ padding: '0.45rem 0.6rem', background: '#ecfeff', border: '1px solid #67e8f9', borderRadius: '0.35rem', cursor: 'pointer' }}>
                        + Thêm lịch theo ngày
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {items.map((it: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {'dayOfWeek' in it ? (
                            <>
                              <select value={it.dayOfWeek} onChange={e => updateItem(subj.course_id, idx, { dayOfWeek: Number(e.target.value) })} style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }}>
                                {[2, 3, 4, 5, 6, 7, 8].map(d => (
                                  <option key={d} value={d}>
                                    {dayLabels[d]}
                                  </option>
                                ))}
                              </select>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Từ</span>
                                <input type="date" value={it.fromDate || ''} onChange={e => updateItem(subj.course_id, idx, { fromDate: e.target.value })} style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Đến</span>
                                <input type="date" value={it.toDate || ''} onChange={e => updateItem(subj.course_id, idx, { toDate: e.target.value })} style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }} />
                              </div>
                            </>
                          ) : (
                            <input type="date" value={it.date} onChange={e => updateItem(subj.course_id, idx, { date: e.target.value })} style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }} />
                          )}

                          <select value={it.startPeriod} onChange={e => updateItem(subj.course_id, idx, { startPeriod: Number(e.target.value) })} style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }}>
                            {periods.map(p => (
                              <option key={p} value={p}>
                                Từ {p}
                              </option>
                            ))}
                          </select>
                          <select value={it.endPeriod} onChange={e => updateItem(subj.course_id, idx, { endPeriod: Number(e.target.value) })} style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }}>
                            {periods.map(p => (
                              <option key={p} value={p}>
                                Đến {p}
                              </option>
                            ))}
                          </select>
                          <input value={it.room || ''} onChange={e => updateItem(subj.course_id, idx, { room: e.target.value })} placeholder="Phòng" style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', minWidth: '130px' }} />
                          <button type="button" onClick={() => removeItem(subj.course_id, idx)} style={{ padding: '0.35rem 0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.35rem', cursor: 'pointer', fontWeight: 700 }}>
                            X
                          </button>
                        </div>
                      ))}
                      {items.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chưa có lịch.</div>}
                    </div>
                  </div>
                )
              })}
              {subjectsForClass.length === 0 && <div style={{ color: '#94a3b8' }}>Lớp này chưa có môn nào trong học kỳ đã chọn.</div>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Preview thời khóa biểu</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button type="button" onClick={() => { const d = new Date(previewBaseDate); d.setDate(d.getDate() - 7); setPreviewBaseDate(d); }} style={{ padding: '0.3rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', background: '#f8fafc', cursor: 'pointer' }}>&lt; Tuần trước</button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                  {previewDates[2].split('-').reverse().join('/')} - {previewDates[8].split('-').reverse().join('/')}
                </span>
                <button type="button" onClick={() => { const d = new Date(previewBaseDate); d.setDate(d.getDate() + 7); setPreviewBaseDate(d); }} style={{ padding: '0.3rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', background: '#f8fafc', cursor: 'pointer' }}>Tuần sau &gt;</button>
              </div>
            </div>
            <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.75rem', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '420px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>Tiết</th>
                    {[2, 3, 4, 5, 6, 7, 8].map(d => {
                      const dateStr = previewDates[d].split('-').slice(1).reverse().join('/')
                      return (
                        <th key={d} style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                          {dayLabels[d]} <span style={{ fontWeight: 'normal', fontSize: '0.75rem' }}>({dateStr})</span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(p => (
                    <tr key={p}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 700 }}>{p}</td>
                      {[2, 3, 4, 5, 6, 7, 8].map(d => {
                        const codes = weeklyPreview[d]?.[p] || []
                        return (
                          <td key={d} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                            {codes.length ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {codes.map((c, idx) => (
                                  <span key={idx} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '0.1rem 0.45rem', fontSize: '0.75rem', color: '#1e3a8a' }}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Đang lưu...' : 'Lưu thời khóa biểu (và đồng bộ sang Portal)'}
      </button>
    </form>
  )
}

