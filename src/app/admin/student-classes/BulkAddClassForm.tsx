'use client'
import { useState, useCallback } from 'react'
import { createBulkStudentClasses } from '@/actions/admin/student-classes'
import styles from '../users/page.module.css'

type ClassRow = {
  id: number
  name: string
  department_id: string
}

let rowCounter = 1

export function BulkAddClassForm({
  onSuccess,
  departments = [],
}: {
  onSuccess?: () => void
  departments?: any[]
}) {
  const [cohort, setCohort] = useState('')
  const [rows, setRows] = useState<ClassRow[]>([{ id: rowCounter++, name: '', department_id: '' }])
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const addRow = useCallback(() => {
    setRows(prev => [...prev, { id: rowCounter++, name: '', department_id: '' }])
  }, [])

  const removeRow = useCallback((id: number) => {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev))
  }, [])

  const updateRow = useCallback((id: number, field: keyof Omit<ClassRow, 'id'>, value: string) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!cohort.trim()) {
      setError('Vui lòng nhập Khóa.')
      return
    }
    setLoading(true)
    try {
      const payload = rows.map(r => ({
        name: r.name,
        department_id: r.department_id || null,
      }))
      const res = await createBulkStudentClasses(cohort, payload)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccessMsg(`Đã tạo thành công ${(res as any).count} lớp thuộc Khóa ${cohort.trim().toUpperCase()}!`)
        setCohort('')
        rowCounter = 1
        setRows([{ id: rowCounter++, name: '', department_id: '' }])
        setTimeout(() => {
          setSuccessMsg('')
          if (onSuccess) onSuccess()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.9rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Messages */}
      {error && (
        <div style={{ color: '#ef4444', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fca5a5', fontWeight: 500, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ color: '#16a34a', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #86efac', fontWeight: 500, fontSize: '0.875rem' }}>
          {successMsg}
        </div>
      )}

      {/* Bước 1 – Khóa */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Bước 1 – Nhập Khóa <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={cohort}
          onChange={e => setCohort(e.target.value)}
          required
          style={{ ...inputBase, fontWeight: 600, fontSize: '1rem' }}
        />
      </div>

      {/* Bước 2 – Danh sách lớp */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bước 2 – Danh sách các lớp
          </span>
          <button
            type="button"
            onClick={addRow}
            style={{
              padding: '0.35rem 0.8rem',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1.5px dashed #93c5fd',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            + Thêm dòng
          </button>
        </div>

        {/* Column labels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '0.5rem', marginBottom: '0.375rem', paddingLeft: '2px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Tên lớp / Mã lớp</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Khoa viện</span>
          <span />
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rows.map(row => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={row.name}
                onChange={e => updateRow(row.id, 'name', e.target.value)}
                required
                style={inputBase}
              />
              <select
                value={row.department_id}
                onChange={e => updateRow(row.id, 'department_id', e.target.value)}
                style={{ ...inputBase, color: row.department_id ? '#0f172a' : '#94a3b8' }}
              >
                <option value="">-- Chọn Khoa viện --</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                title="Xóa dòng"
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: rows.length === 1 ? '#f1f5f9' : '#fff1f2',
                  color: rows.length === 1 ? '#94a3b8' : '#ef4444',
                  border: `1px solid ${rows.length === 1 ? '#e2e8f0' : '#fecaca'}`,
                  borderRadius: '0.375rem',
                  cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
          Tổng cộng: <strong style={{ color: '#3b82f6' }}>{rows.length}</strong> lớp
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={styles.submitBtn}
        style={{ opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Đang tạo...
          </>
        ) : (
          `Tạo ${rows.length} lớp`
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
