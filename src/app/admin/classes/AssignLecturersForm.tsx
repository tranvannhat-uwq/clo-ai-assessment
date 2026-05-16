'use client'

import { useMemo, useState } from 'react'
import { assignLecturersForClassSubjects } from '@/actions/admin/classes'
import styles from '../users/page.module.css'

export function AssignLecturersForm({
  studentClasses,
  classSubjects,
  courses,
  courseLecturerTemplates,
  defaultStudentClassId,
  defaultSemester
}: {
  studentClasses: any[]
  classSubjects: any[]
  courses: any[]
  courseLecturerTemplates: any[]
  defaultStudentClassId?: string
  defaultSemester?: string
}) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudentClassId, setSelectedStudentClassId] = useState(defaultStudentClassId || '')
  const [semester, setSemester] = useState(defaultSemester || '')

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

  const subjectsForClass = useMemo(
    () =>
      classSubjects
        .filter(
          (s: any) =>
            s.student_class_id === selectedStudentClassId && (!semester || s.semester === semester)
        )
        .map((s: any) => ({
          ...s,
          course: courses.find(c => c.id === s.course_id)
        })),
    [classSubjects, selectedStudentClassId, semester, courses]
  )

  const lecturerTemplatesByCourse = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const tpl of courseLecturerTemplates || []) {
      const arr = map.get(tpl.course_id) || []
      if (!arr.find(a => a.lecturer_id === tpl.lecturer_id)) {
        arr.push(tpl)
      }
      map.set(tpl.course_id, arr)
    }
    return map
  }, [courseLecturerTemplates])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await assignLecturersForClassSubjects(formData)
      if (res && 'error' in res) setError(String(res.error || 'Không thể lưu phân công.'))
      else window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div
          style={{
            color: '#ef4444',
            marginBottom: '0.5rem',
            padding: '0.75rem',
            background: '#fef2f2',
            borderRadius: '0.5rem',
            border: '1px solid #fca5a5',
            fontWeight: 500,
            fontSize: '0.9rem'
          }}
        >
          {error}
        </div>
      )}

      <div className={styles.inputGroup}>
        <label>Chọn Lớp hành chính</label>
        <select
          name="studentClassId"
          value={selectedStudentClassId}
          onChange={e => setSelectedStudentClassId(e.target.value)}
          required
        >
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
        <select
          name="semester"
          value={semester}
          onChange={e => setSemester(e.target.value)}
          required
        >
          <option value="">-- Chọn học kỳ --</option>
          {availableSemesters.map(sem => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      {selectedStudentClassId && semester && (
        <div className={styles.inputGroup}>
          <label>Chọn giảng viên cho từng môn (dùng lịch mẫu đã cấu hình)</label>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              maxHeight: '320px',
              overflowY: 'auto'
            }}
          >
            {subjectsForClass.map((s: any) => {
              const templates = lecturerTemplatesByCourse.get(s.course_id) || []
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px dashed #e2e8f0'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {s.course?.code} - {s.course?.name}
                  </div>
                  {templates.length === 0 ? (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      Môn này chưa được gán giảng viên/lịch ở mục Phân công lịch giảng dạy.
                    </span>
                  ) : (
                    <select
                      name={`lecturer_${s.course_id}`}
                      defaultValue={s.lecturer_id || ''}
                      style={{ padding: '0.5rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- Chưa chọn giảng viên --</option>
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.lecturer_id}>
                          {tpl.profiles?.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
            {subjectsForClass.length === 0 && (
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Lớp này chưa có môn học nào được gán cho học kỳ đã chọn.
              </span>
            )}
          </div>
        </div>
      )}

      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Đang lưu...' : 'Phân công giảng viên cho lớp'}
      </button>
    </form>
  )
}

