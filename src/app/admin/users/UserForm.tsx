'use client'

import { useState } from 'react'
import { createUser } from '@/actions/admin/users'
import styles from './page.module.css'

export function UserForm({ studentClasses, departments }: { studentClasses: any[], departments?: any[] }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('STUDENT')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await createUser(formData)
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
      {error && <div style={{color: '#ef4444', marginBottom: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.9rem'}}>{error}</div>}
      <div className={styles.inputGroup}>
        <label>Vai trò</label>
        <select name="role" required value={role} onChange={e => setRole(e.target.value)}>
          <option value="STUDENT">Sinh viên</option>
          <option value="LECTURER">Giảng viên</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
      </div>
      
      <div className={styles.inputGroup}>
        <label>Mã (SV/GV)</label>
        <input type="text" name="code" required placeholder="CNTT01" />
      </div>

      <div className={styles.inputGroup}>
        <label>Họ và Tên</label>
        <input type="text" name="fullName" required placeholder="Nguyễn Văn A" />
      </div>

      <div className={styles.inputGroup}>
        <label>Email đăng nhập</label>
        <input type="email" name="email" required placeholder="sv@school.edu.vn" />
      </div>

      <div className={styles.inputGroup}>
        <label>Mật khẩu khởi tạo</label>
        <input type="password" name="password" required minLength={6} placeholder="Bắt buộc tối thiểu 6 ký tự" />
      </div>

      {(role === 'LECTURER' || role === 'STUDENT') && (
        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
          <label>Khoa / Đơn vị quản lý</label>
          <select name="departmentId">
             <option value="">-- Chưa ghi nhận khoa --</option>
             {departments?.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
          </select>
        </div>
      )}

      {role === 'STUDENT' && (
        <>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Lớp hành chính (Dành cho Sinh viên)</label>
            <select name="studentClassId">
              <option value="">-- Chưa xếp lớp --</option>
              {studentClasses?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.cohort})</option>)}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Khóa</label>
            <input type="text" name="cohort" placeholder="K62, K63..." />
          </div>
          <div className={styles.inputGroup}>
            <label>Ngày sinh</label>
            <input type="date" name="dob" />
          </div>
          <div className={styles.inputGroup}>
            <label>Giới tính</label>
            <select name="gender">
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Quê quán</label>
            <input type="text" name="hometown" placeholder="Hà Nội, TP.HCM..." />
          </div>
        </>
      )}
      
      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Hệ thống đang thêm mới...' : 'Tạo tài khoản'}
      </button>
    </form>
  )
}
