'use client'
import { useMemo, useState } from 'react'
import { createClassByStudentClasses } from '@/actions/admin/classes'
import styles from '../users/page.module.css'

export function ClassForm({
  courses,
  lecturers,
  studentClasses,
  courseLecturerTemplates
}: {
  courses: any[]
  lecturers: any[]
  studentClasses: any[]
  courseLecturerTemplates: any[]
}) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [semester, setSemester] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await createClassByStudentClasses(formData)
      if (res?.error) setError(res.error)
      else {
        (e.target as HTMLFormElement).reset()
        setSelectedCohort('')
        setSelectedCourseId('')
        setSemester('')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cohorts = useMemo(
    () => Array.from(new Set((studentClasses || []).map(c => c.cohort).filter(Boolean))),
    [studentClasses]
  )
  const filteredStudentClasses = useMemo(
    () => (!selectedCohort ? [] : (studentClasses || []).filter(c => c.cohort === selectedCohort)),
    [selectedCohort, studentClasses]
  )
  const templateLecturers = useMemo(
    () => (courseLecturerTemplates || []).filter(t => t.course_id === selectedCourseId && t.semester === semester),
    [courseLecturerTemplates, selectedCourseId, semester]
  )
  const formatScheduleList = (str: string) => {
    if (!str) return 'Chưa gán lịch'
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) {
        return parsed.map(p => {
          if (p.date) return `${p.date} (${p.startPeriod}-${p.endPeriod})`
          return `T${p.dayOfWeek || '?'} (${p.startPeriod}-${p.endPeriod})`
        }).join(', ')
      }
    } catch {
      return str
    }
    return str
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div style={{color: '#ef4444', marginBottom: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.9rem'}}>{error}</div>}
      
      <div className={styles.inputGroup}>
        <label>Môn học hệ thống</label>
        <select name="courseId" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} required>
          <option value="">-- Chọn môn học --</option>
          {courses?.map(c => {
            const hasLecturers = c.classes && c.classes.length > 0;
            return (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name} {!hasLecturers ? ' (⚠️ Chưa có GV)' : ''}
              </option>
            )
          })}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Chọn Khóa</label>
        <select value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)} required>
          <option value="">-- Chọn khóa --</option>
          {cohorts.map(cohort => (
            <option key={cohort} value={cohort}>{cohort}</option>
          ))}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Chọn Lớp sinh viên trong khóa (có thể chọn nhiều lớp)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'white', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
          {filteredStudentClasses.map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#334155' }}>
              <input type="checkbox" name="studentClassId" value={c.id} />
              <span>{c.name} ({c.cohort})</span>
            </label>
          ))}
          {selectedCohort && filteredStudentClasses.length === 0 && (
            <span style={{ color: '#94a3b8' }}>Khóa này chưa có lớp sinh viên.</span>
          )}
          {!selectedCohort && (
            <span style={{ color: '#94a3b8' }}>Chọn khóa trước để hiển thị danh sách lớp.</span>
          )}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Phân công Giảng viên cho môn học đã chọn</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'white', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {templateLecturers.map(t => (
            <label key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.95rem', cursor: 'pointer', color: '#334155', paddingBottom: '0.8rem', borderBottom: '1px dashed #e2e8f0' }}>
              <input type="checkbox" name="lecturerId" value={t.lecturer_id} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', flexShrink: 0, marginTop: '0.1rem' }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontWeight: 600 }}>{t.profiles?.full_name || lecturers.find(l => l.id === t.lecturer_id)?.full_name || t.lecturer_id}</span>
                <span style={{ color: '#0f766e', fontSize: '0.85rem' }}>Lịch mẫu: {formatScheduleList(t.schedule || '')}</span>
              </span>
            </label>
          ))}
          {selectedCourseId && semester && templateLecturers.length === 0 && (
            <span style={{ color: '#94a3b8' }}>Môn này chưa được gán giảng viên/lịch ở mục Quản lý Môn học.</span>
          )}
          {(!selectedCourseId || !semester) && (
            <span style={{ color: '#94a3b8' }}>Chọn môn học + học kỳ để hiện danh sách giảng viên đã gán.</span>
          )}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Thời điểm Học kỳ</label>
        <input type="text" name="semester" value={semester} onChange={e => setSemester(e.target.value)} required placeholder="VD: Học kỳ 1, 2026-2027" />
      </div>
      
      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Hệ thống đang lưu...' : 'Phân công môn học cho các lớp đã chọn'}
      </button>
    </form>
  )
}
