'use client'
import { useState } from 'react'
import { updateClass } from '@/actions/admin/classes'
import styles from '../../../users/page.module.css'
import Link from 'next/link'

export function EditClassForm({ currentClass, courses, lecturers }: any) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await updateClass(formData)
      if (res?.error) setError(res.error)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div style={{ color: '#ef4444', marginBottom: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.9rem' }}>{error}</div>}

      <input type="hidden" name="id" value={currentClass.id} />

      <div className={styles.inputGroup}>
        <label>Môn học hệ thống</label>
        <select name="courseId" required defaultValue={currentClass.course_id}>
          <option value="">-- Chọn Môn --</option>
          {courses?.map((c: any) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Giảng viên phụ trách (1 người / lớp)</label>
        <select name="lecturerId" required defaultValue={currentClass.lecturer_id}>
          <option value="">-- Thay đổi giảng viên --</option>
          {lecturers?.map((l: any) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Thời điểm Học kỳ</label>
        <input type="text" name="semester" required defaultValue={currentClass.semester} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="submit" disabled={loading} className={styles.submitBtn} style={{ flex: 1, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Đang cập nhật DB...' : 'Cập nhật Lớp'}
        </button>
        <Link href="/admin/classes" style={{ flex: 1, textAlign: 'center', lineHeight: '3rem', background: '#f1f5f9', color: '#475569', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Quay lại Bảng</Link>
      </div>
    </form>
  )
}
