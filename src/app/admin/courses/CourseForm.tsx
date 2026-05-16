'use client'
import { useState } from 'react'
import { createCourse } from '@/actions/admin/courses'
import styles from '../users/page.module.css'

export function CourseForm({ onSuccess }: { onSuccess?: () => void }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await createCourse(formData)
      if (res?.error) setError(res.error)
      else {
        (e.target as HTMLFormElement).reset()
        if (onSuccess) onSuccess()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div style={{color: '#ef4444', marginBottom: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.9rem'}}>{error}</div>}
      
      <div className={styles.inputGroup}>
        <label>Mã môn học</label>
        <input type="text" name="code" required placeholder="VD: INT1234" />
      </div>

      <div className={styles.inputGroup}>
        <label>Tên môn học</label>
        <input type="text" name="name" required placeholder="Lập trình web" />
      </div>

      <div className={styles.inputGroup}>
        <label>Số tín chỉ</label>
        <input type="number" name="credits" required min="1" max="10" defaultValue="3" />
      </div>
      
      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Hệ thống đang lưu...' : 'Lưu môn học'}
      </button>
    </form>
  )
}
