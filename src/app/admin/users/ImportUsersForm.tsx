'use client'

import { useState } from 'react'
import { bulkCreateUsers } from '@/actions/admin/users'
import styles from './page.module.css'

export function ImportUsersForm({ studentClasses }: { studentClasses: any[] }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const XLSX = await import('xlsx')
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)

          let usersToCreate = json.map((row: any) => ({
            role: row.role || row.Role || row['Vai trò'],
            code: row.code || row.Code || row['Mã'] || row['Mã SV'] || row['Mã GV'],
            fullName: row.fullName || row['Họ Tên'] || row['Họ và Tên'] || row.FullName,
            email: row.email || row.Email,
            password: row.password || row.Password || row['Mật khẩu'],
            _rawClassName: row.className || row.ClassName || row['Lớp'] || row['Tên Lớp'] || null,
            cohort: row.cohort || row.Cohort || row['Khóa'] || null,
            dob: row.dob || row.DOB || row['Ngày sinh'] || null,
            gender: row.gender || row.Gender || row['Giới tính'] || null,
            hometown: row.hometown || row.Hometown || row['Quê quán'] || null
          }))

          usersToCreate = usersToCreate.map((row: any) => {
            if (row._rawClassName) {
              const foundCls = studentClasses.find((c: any) => c.name.toLowerCase() === String(row._rawClassName).trim().toLowerCase())
              row.studentClassId = foundCls ? foundCls.id : null
            }
            delete row._rawClassName
            return row
          })

          if (usersToCreate.length === 0) {
            setMessage({ type: 'error', text: 'File không có dữ liệu hợp lệ.' })
            setLoading(false)
            return
          }

          const res = await bulkCreateUsers(usersToCreate)
          
          if (res.failed > 0) {
            setMessage({ type: 'error', text: `Thành công: ${res.success}. Lỗi: ${res.failed}. Chi tiết: ${res.errors.join(', ')}` })
          } else {
            setMessage({ type: 'success', text: `Đã nhập thành công ${res.success} tài khoản.` })
          }
        } catch (err: any) {
          setMessage({ type: 'error', text: `Lỗi đọc file: ${err.message}` })
        } finally {
          setLoading(false)
          // Reset file input
          e.target.value = ''
        }
      }
      reader.readAsArrayBuffer(file)

    } catch (err: any) {
      setMessage({ type: 'error', text: `Lỗi: ${err.message}` })
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className={styles.form} style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1e293b' }}>Nhập từ file Excel</h3>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
        Khuyến nghị các cột: <strong>role</strong> (STUDENT/LECTURER/ADMIN), <strong>code</strong>, <strong>fullName</strong>, <strong>email</strong>, <strong>password</strong>. Tùy chọn cho sinh viên: <strong>Lớp</strong>, <strong>Khóa</strong>, <strong>Ngày sinh</strong>, <strong>Giới tính</strong>, <strong>Quê quán</strong>.
      </p>
      
      {message && (
        <div style={{
          color: message.type === 'error' ? '#ef4444' : '#10b981',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
          borderRadius: '0.5rem',
          border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          fontWeight: 500,
          fontSize: '0.9rem',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          {message.text}
        </div>
      )}

      <div className={styles.inputGroup}>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
          disabled={loading}
          style={{ 
            padding: '0.5rem 0',
            width: '100%',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        />
      </div>

      {loading && <div style={{ fontSize: '0.9rem', color: '#3b82f6', marginTop: '0.5rem', fontWeight: 500 }}>Đang xử lý, vui lòng đợi...</div>}
    </div>
  )
}
