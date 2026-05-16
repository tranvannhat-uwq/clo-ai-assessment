'use client'

import { useMemo, useState } from 'react'
import { upsertCourseLecturerTemplates } from '@/actions/admin/classes'
import styles from '../users/page.module.css'

export function CourseLecturerTemplateForm({
  courses,
  lecturers,
  templates,
  defaultCourseId,
  defaultSemester,
  onSuccess
}: {
  courses: any[]
  lecturers: any[]
  templates: any[]
  defaultCourseId?: string
  defaultSemester?: string
  onSuccess?: () => void
}) {
  const [courseId, setCourseId] = useState(defaultCourseId || '')
  const semester = 'Mặc định'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const coursesAlreadyAssigned = useMemo(() => {
    const set = new Set<string>()
    for (const t of templates || []) {
      set.add(t.course_id)
    }
    return set
  }, [templates])

  const selectableCourses = useMemo(() => {
    if (defaultCourseId) return courses.filter(c => c.id === defaultCourseId)
    return courses.filter(c => !coursesAlreadyAssigned.has(c.id))
  }, [courses, coursesAlreadyAssigned, defaultCourseId])

  const templateMap = useMemo(() => {
    const map = new Map<string, any>()
    templates
      .filter(t => t.course_id === courseId)
      .forEach(t => map.set(t.lecturer_id, t))
    return map
  }, [templates, courseId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    if (defaultCourseId) {
      formData.set('courseId', courseId)
    }
    try {
      const res = await upsertCourseLecturerTemplates(formData)
      if (res?.error) setError(res.error)
      else if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu phân công giảng viên môn học.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div style={{ color: '#ef4444', marginBottom: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.9rem' }}>{error}</div>}

      <div className={styles.inputGroup}>
        <label>Môn học</label>
        <select name="courseId" value={courseId} onChange={e => setCourseId(e.target.value)} required disabled={!!defaultCourseId}>
          <option value="">-- Chọn môn học --</option>
          {selectableCourses.map(c => (
            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
          ))}
        </select>
        {!defaultCourseId && selectableCourses.length === 0 && (
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Tất cả môn đã được gán giảng viên. Hãy dùng nút Sửa ở danh sách.
          </span>
        )}
      </div>

      <input type="hidden" name="semester" value={semester} />

      <div className={styles.inputGroup}>
        <label>Gán giảng viên cho môn học</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'white', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {lecturers.map(l => {
            const selectedTemplate = templateMap.get(l.id)
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px dashed #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', cursor: 'pointer', color: '#334155', flex: 1 }}>
                  <input type="checkbox" name="lecturerId" value={l.id} defaultChecked={!!selectedTemplate} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{l.full_name} {l.departments?.name ? `(${l.departments.name})` : ''}</span>
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Đang lưu...' : 'Lưu cấu hình giảng viên môn học'}
      </button>
    </form>
  )
}

