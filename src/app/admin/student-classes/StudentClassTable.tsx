'use client'
import { useState } from 'react'
import { updateStudentClass, deleteStudentClass } from '@/actions/admin/student-classes'
import { BulkAddClassForm } from './BulkAddClassForm'
import styles from '../users/page.module.css'

export function StudentClassTable({ classes, departments = [] }: { classes: any[], departments?: any[] }) {
  const [editingCls, setEditingCls] = useState<any | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<string>('all')
  
  const cohorts = Array.from(new Set(classes.map(c => c.cohort))).sort()
  const filteredClasses = selectedCohort === 'all' ? classes : classes.filter(c => c.cohort === selectedCohort)

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCls) return
    const formData = new FormData(e.currentTarget)
    await updateStudentClass(editingCls.id, formData)
    setEditingCls(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa Lớp này? Nếu đã gán cho sinh viên, sinh viên sẽ bị đưa về trạng thái Trống.')) {
      await deleteStudentClass(id)
    }
  }

  const ModalBackdrop = ({ children, onClose }: any) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        {children}
      </div>
    </div>
  )

  return (
    <div className={styles.tableCard} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Danh sách Lớp sinh viên</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={selectedCohort} 
            onChange={e => setSelectedCohort(e.target.value)}
            style={{ padding: '0.5rem 2rem 0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#f8fafc' }}
          >
            <option value="all">Tất cả các khóa</option>
            {cohorts.map(c => (
              <option key={c as string} value={c as string}>Khóa {c as string}</option>
            ))}
          </select>

          <button
              onClick={() => setShowBulkModal(true)}
              className={styles.submitBtn}
              style={{ margin: 0, padding: '0.5rem 1rem' }}
            >
              + Thêm lớp
            </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Khóa</th>
              <th>Tên Lớp (Mã Lớp)</th>
              <th>Khoa viện</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map(c => (
              <tr key={c.id}>
                <td><strong>{c.cohort}</strong></td>
                <td><span style={{ color: '#0369a1', fontWeight: 600, background: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '0.2rem' }}>{c.name}</span></td>
                <td>{departments.find((d: any) => d.id === c.department_id)?.name || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Chưa chọn</span>}</td>
                <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingCls(c)} className={styles.submitBtn} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', background: '#10b981', margin: 0 }}>Sửa</button>
                    <button onClick={() => handleDelete(c.id)} className={styles.deleteBtn} style={{ margin: 0 }}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>Chưa có danh mục lớp cho khóa này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showBulkModal && (
        <ModalBackdrop onClose={() => setShowBulkModal(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Thêm lớp hành chính</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>Nhập khóa, sau đó thêm nhiều lớp cùng lúc.</p>
            </div>
            <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, color: '#64748b' }}>&times;</button>
          </div>
          <BulkAddClassForm departments={departments} onSuccess={() => setShowBulkModal(false)} />
        </ModalBackdrop>
      )}


      {editingCls && (
        <ModalBackdrop onClose={() => setEditingCls(null)}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Sửa thông tin Lớp</h3>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Mã lớp hành chính</label>
              <input name="name" defaultValue={editingCls.name} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Khóa học</label>
              <input name="cohort" defaultValue={editingCls.cohort} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Khoa viện</label>
              <select name="department_id" defaultValue={editingCls.department_id || ''} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}>
                <option value="" disabled>-- Chọn Khoa viện --</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Lưu thay đổi</button>
              <button type="button" onClick={() => setEditingCls(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
            </div>
          </form>
        </ModalBackdrop>
      )}
    </div>
  )
}
