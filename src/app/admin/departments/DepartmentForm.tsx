'use client'

import { useState } from 'react'
import { createDepartment } from '@/actions/admin/departments'
import styles from '../users/page.module.css'

export function DepartmentForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await createDepartment(formData)
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
      {error && <div style={{color: '#ef4444', marginBottom: '0.5rem'}}>{error}</div>}
      
      <div className={styles.inputGroup}>
        <label>Mã Khoa (VD: CNTT)</label>
        <input type="text" name="code" required />
      </div>

      <div className={styles.inputGroup}>
        <label>Tên Khoa/Viện (VD: Công nghệ thông tin)</label>
        <input type="text" name="name" required />
      </div>

      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? 'Đang lưu...' : 'Lưu dữ liệu'}
      </button>
    </form>
  )
}
