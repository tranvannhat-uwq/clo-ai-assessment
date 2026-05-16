'use client'

import { useState } from 'react'
import { updateDepartment, deleteDepartment } from '@/actions/admin/departments'
import styles from '../users/page.module.css'

export function DepartmentTable({ departments }: { departments: any[] }) {
  const [editingDep, setEditingDep] = useState<any | null>(null)
  const [deletingDep, setDeletingDep] = useState<any | null>(null)
  const [message, setMessage] = useState('')

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingDep) return
    const formData = new FormData(e.currentTarget)
    const res = await updateDepartment(editingDep.id, formData)
    if (res?.error) {
      setMessage(res.error)
    } else {
      setEditingDep(null)
      setMessage('')
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletingDep) return
    const res = await deleteDepartment(deletingDep.id)
    if (res?.error) {
       console.error(res.error)
       alert("Lỗi xóa: Khoa này đã có dữ liệu liên kết.")
    } else {
       setDeletingDep(null)
    }
  }

  const ModalBackdrop = ({ children, onClose }: any) => (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{background: 'white', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px'}}>
        {children}
      </div>
    </div>
  )

  return (
    <>
      <div className={styles.tableCard}>
        <h2>Danh sách Khoa/Viện</h2>
        
        {departments.length === 0 ? (
          <p style={{color: '#64748b'}}>Chưa có dữ liệu nào. Vui lòng thêm Khoa/Viện trước.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã Khoa</th>
                  <th>Tên Khoa/Viện</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d: any) => (
                  <tr key={d.id}>
                    <td><strong>{d.code}</strong></td>
                    <td>{d.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setEditingDep(d)} style={{ padding: '0.375rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>Sửa</button>
                        <button onClick={() => setDeletingDep(d)} style={{ padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingDep && (
        <ModalBackdrop onClose={() => setEditingDep(null)}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Chỉnh sửa: {editingDep.name}</h3>
          {message && <div style={{color: '#ef4444', marginBottom: '1rem'}}>{message}</div>}
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Mã Khoa</label>
              <input name="code" defaultValue={editingDep.code} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Tên Khoa/Viện</label>
              <input name="name" defaultValue={editingDep.name} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cập nhật</button>
              <button type="button" onClick={() => setEditingDep(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Hủy</button>
            </div>
          </form>
        </ModalBackdrop>
      )}

      {deletingDep && (
        <ModalBackdrop onClose={() => setDeletingDep(null)}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: '#ef4444' }}>Xác nhận xóa Khoa</h3>
          <p style={{ marginBottom: '1.5rem' }}>Bạn có chắc muốn xóa <strong>{deletingDep.name}</strong> không?</p>
          <form onSubmit={handleDelete} style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Xóa vĩnh viễn</button>
            <button type="button" onClick={() => setDeletingDep(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Hủy</button>
          </form>
        </ModalBackdrop>
      )}
    </>
  )
}
