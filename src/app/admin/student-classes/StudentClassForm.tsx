'use client'
import { useState } from 'react'
import { createStudentClass } from '@/actions/admin/student-classes'
import styles from '../users/page.module.css'

export function StudentClassForm({ onSuccess, departments = [] }: { onSuccess?: () => void, departments?: any[] }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await createStudentClass(formData)
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
        <label>Tên Lớp sinh viên</label>
        <input type="text" name="name" required placeholder="VD: CNTTK20G" />
      </div>
      <div className={styles.inputGroup}>
        <label>Thuộc khóa</label>
        <input type="text" name="cohort" required placeholder="VD: K20" />
      </div>
      <div className={styles.inputGroup}>
        <label>Khoa viện</label>
        <select name="department_id" required defaultValue="">
          <option value="" disabled>-- Chọn Khoa viện --</option>
          {departments.map((dept: any) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>
      
      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Hệ thống đang lưu...' : 'Tạo lớp'}
      </button>
    </form>
  )
}
