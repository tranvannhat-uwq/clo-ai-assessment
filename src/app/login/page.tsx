'use client'

import { useState, FormEvent } from 'react'
import { login } from '@/actions/auth'
import styles from './page.module.css'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      // Logic server redirecting is handled properly via next/navigation
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h2>Hệ Thống Đánh Giá CLO</h2>
          <p>Sử dụng AI tiên tiến trong Giáo dục</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">Tài khoản Email</label>
            <input type="email" id="email" name="email" required placeholder="sinhvien@school.edu.vn" />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" />
          </div>
          
          <button type="submit" disabled={isPending} className={styles.button}>
            {isPending ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
