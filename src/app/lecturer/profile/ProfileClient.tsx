'use client'

import { useState } from 'react'
import { updateLecturerProfile, changeLecturerPassword } from '@/actions/lecturer/profile'
import styles from '../page.module.css'

export function ProfileClient({ profile, email }: { profile: any; email: string }) {
  const [infoMsg, setInfoMsg] = useState('')
  const [infoErr, setInfoErr] = useState('')
  const [infoLoading, setInfoLoading] = useState(false)

  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInfoLoading(true)
    setInfoMsg('')
    setInfoErr('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await updateLecturerProfile(formData)
      if (res?.error) setInfoErr(res.error)
      else setInfoMsg('Đã cập nhật thông tin thành công!')
    } catch (err: any) {
      setInfoErr(err.message)
    } finally {
      setInfoLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg('')
    setPwErr('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await changeLecturerPassword(formData)
      if (res?.error) setPwErr(res.error)
      else {
        setPwMsg('Đổi mật khẩu thành công!')
        ;(e.target as HTMLFormElement).reset()
      }
    } catch (err: any) {
      setPwErr(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.85rem',
    borderRadius: '0.375rem',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#475569',
    marginBottom: '0.35rem',
  }

  return (
    <div>
      <h1 className={styles.title}>Tài khoản cá nhân</h1>
      <p style={{ marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem' }}>
        Quản lý thông tin cá nhân và bảo mật tài khoản.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '900px' }}>
        {/* Cập nhật thông tin */}
        <div className={styles.card} style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Cập nhật thông tin
          </h3>

          {infoMsg && <div style={{ color: '#16a34a', padding: '0.6rem', background: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #86efac', fontWeight: 500, fontSize: '0.85rem', marginBottom: '1rem' }}>{infoMsg}</div>}
          {infoErr && <div style={{ color: '#ef4444', padding: '0.6rem', background: '#fef2f2', borderRadius: '0.375rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.85rem', marginBottom: '1rem' }}>{infoErr}</div>}

          <form onSubmit={handleUpdateInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Email (không thể sửa)</label>
              <input type="text" value={email} disabled style={{ ...inputStyle, background: '#f1f5f9', color: '#94a3b8' }} />
            </div>
            <div>
              <label style={labelStyle}>Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" name="full_name" defaultValue={profile?.full_name || ''} required style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Ngày sinh</label>
                <input type="date" name="dob" defaultValue={profile?.dob || ''} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Giới tính</label>
                <select name="gender" defaultValue={profile?.gender || ''} style={inputStyle}>
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Quê quán</label>
              <input type="text" name="hometown" defaultValue={profile?.hometown || ''} style={inputStyle} />
            </div>
            <button
              type="submit"
              disabled={infoLoading}
              style={{ padding: '0.7rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', opacity: infoLoading ? 0.6 : 1, fontSize: '0.95rem' }}
            >
              {infoLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        {/* Đổi mật khẩu */}
        <div className={styles.card} style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Đổi mật khẩu
          </h3>

          {pwMsg && <div style={{ color: '#16a34a', padding: '0.6rem', background: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #86efac', fontWeight: 500, fontSize: '0.85rem', marginBottom: '1rem' }}>{pwMsg}</div>}
          {pwErr && <div style={{ color: '#ef4444', padding: '0.6rem', background: '#fef2f2', borderRadius: '0.375rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.85rem', marginBottom: '1rem' }}>{pwErr}</div>}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" name="newPassword" required minLength={6} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" name="confirmPassword" required minLength={6} style={inputStyle} />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              style={{ padding: '0.7rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', opacity: pwLoading ? 0.6 : 1, fontSize: '0.95rem' }}
            >
              {pwLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
