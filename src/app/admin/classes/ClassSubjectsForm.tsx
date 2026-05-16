'use client'

import { useMemo, useState } from 'react'
import { createClassSubjectsSemester } from '@/actions/admin/classes'
import styles from '../users/page.module.css'

export function ClassSubjectsForm({ courses, studentClasses }: { courses: any[]; studentClasses: any[] }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState('')

  const cohorts = useMemo(
    () => Array.from(new Set((studentClasses || []).map(c => c.cohort).filter(Boolean))),
    [studentClasses]
  )

  const filteredStudentClasses = useMemo(
    () => (!selectedCohort ? [] : (studentClasses || []).filter(c => c.cohort === selectedCohort)),
    [selectedCohort, studentClasses]
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await createClassSubjectsSemester(formData)
      if (res?.error) setError(res.error)
      else (e.target as HTMLFormElement).reset()
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
        <label>Chọn Khóa</label>
        <select value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)} required>
          <option value="">-- Chọn khóa --</option>
          {cohorts.map(cohort => (
            <option key={cohort} value={cohort}>
              {cohort}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Chọn Lớp hành chính trong khóa (có thể chọn nhiều lớp)</label>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'white',
            padding: '1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {filteredStudentClasses.map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155' }}>
              <input type="checkbox" name="studentClassId" value={c.id} />
              <span>
                {c.name} ({c.cohort})
              </span>
            </label>
          ))}
          {selectedCohort && filteredStudentClasses.length === 0 && (
            <span style={{ color: '#94a3b8' }}>Khóa này chưa có lớp sinh viên.</span>
          )}
          {!selectedCohort && <span style={{ color: '#94a3b8' }}>Chọn khóa trước để hiển thị danh sách lớp.</span>}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Chọn Môn học sẽ dạy trong Học kỳ</label>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'white',
            padding: '1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {courses?.map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155' }}>
              <input type="checkbox" name="courseId" value={c.id} />
              <span>
                {c.code} - {c.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Học kỳ</label>
        <input type="text" name="semester" required placeholder="VD: Học kỳ 1 - 2026" />
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Đang lưu...' : 'Gán môn cho các lớp đã chọn'}
      </button>
    </form>
  )
}

