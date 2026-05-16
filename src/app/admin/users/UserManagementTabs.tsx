'use client'

import { useState } from 'react'
import { deleteUser, resetUserPassword, updateUser } from '@/actions/admin/users'
import styles from './page.module.css'

export function UserManagementTabs({ profiles, studentClasses, departments }: { profiles: any[], studentClasses: any[], departments?: any[] }) {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'LECTURER' | 'ADMIN'>('STUDENT')
  const [cohortFilter, setCohortFilter] = useState<string>('ALL')
  const [classFilter, setClassFilter] = useState<string>('ALL')
  
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [resettingUser, setResettingUser] = useState<any | null>(null)
  const [deletingUser, setDeletingUser] = useState<any | null>(null)

  const [message, setMessage] = useState<{ text: string, type: 'error'|'success' } | null>(null)

  const students = profiles.filter(p => p.role === 'STUDENT')
  const lecturers = profiles.filter(p => p.role === 'LECTURER')
  const admins = profiles.filter(p => p.role === 'ADMIN')

  // Lấy danh sách các khóa và lớp độc nhất từ sinh viên
  const uniqueCohorts = Array.from(new Set(students.map(s => s.cohort).filter(Boolean))) as string[]

  let displayedUsers = profiles
  if (activeTab === 'STUDENT') {
    displayedUsers = students
    if (cohortFilter !== 'ALL') {
      displayedUsers = displayedUsers.filter(s => s.cohort === cohortFilter)
    }
    if (classFilter !== 'ALL') {
      displayedUsers = displayedUsers.filter(s => s.student_class_id === classFilter)
    }
  } else if (activeTab === 'LECTURER') {
    displayedUsers = lecturers
  } else if (activeTab === 'ADMIN') {
    displayedUsers = admins
  }

  const showModalMessage = (text: string, type: 'success'|'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resettingUser) return
    const formData = new FormData(e.currentTarget)
    const res = await resetUserPassword(resettingUser.id, formData)
    if (res?.error) {
      showModalMessage(res.error, 'error')
    } else {
      showModalMessage(`Reset mật khẩu thành công cho ${resettingUser.full_name}`, 'success')
      setResettingUser(null)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return
    const formData = new FormData(e.currentTarget)
    const res = await updateUser(editingUser.id, formData)
    if (res?.error) {
       showModalMessage(res.error, 'error')
    } else {
       showModalMessage(`Đã cập nhật thông tin ${editingUser.full_name}`, 'success')
       setEditingUser(null)
    }
  }

  const handleDeleteUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!deletingUser) return
    const res = await deleteUser(deletingUser.id)
    if (res?.error) {
      showModalMessage(res.error, 'error')
    } else {
      showModalMessage('Đã xoá tài khoản thành công', 'success')
      setDeletingUser(null)
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
      <div style={{
        background: 'white', padding: '1.5rem', borderRadius: '0.5rem', 
        width: '90%', maxWidth: '500px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        {children}
      </div>
    </div>
  )

  return (
    <>
      {message && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1100,
          background: message.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minWidth: '250px', textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* MODAL SỬA */}
      {editingUser && (
        <ModalBackdrop onClose={() => setEditingUser(null)}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            Sửa thông tin: {editingUser.full_name}
          </h3>
          <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Mã tài khoản</label>
              <input name="code" defaultValue={editingUser.code} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Họ và Tên</label>
              <input name="fullName" defaultValue={editingUser.full_name} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            
            {editingUser.role === 'STUDENT' && (
              <>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Lớp sinh viên</label>
                    <select name="studentClassId" defaultValue={editingUser.student_class_id || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}>
                      <option value="">-- Trống --</option>
                      {studentClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.cohort})</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Khóa</label>
                    <input name="cohort" defaultValue={editingUser.cohort || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Ngày sinh</label>
                    <input name="dob" type="date" defaultValue={editingUser.dob ? new Date(editingUser.dob).toISOString().split('T')[0] : ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Giới tính</label>
                    <select name="gender" defaultValue={editingUser.gender || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}>
                      <option value="">Không xác định</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Quê quán</label>
                  <input name="hometown" defaultValue={editingUser.hometown || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
                </div>
              </>
            )}

            {(editingUser.role === 'LECTURER' || editingUser.role === 'STUDENT') && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Khoa / Đơn vị quản lý</label>
                <select name="departmentId" defaultValue={editingUser.department_id || ''} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}>
                  <option value="">-- Chưa ghi nhận khoa --</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Lưu thay đổi</button>
              <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
            </div>
          </form>
        </ModalBackdrop>
      )}

      {/* MODAL RESET PASS */}
      {resettingUser && (
        <ModalBackdrop onClose={() => setResettingUser(null)}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            Reset mật khẩu cho: {resettingUser.full_name}
          </h3>
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Mật khẩu mới (Tối thiểu 6 ký tự)</label>
              <input name="password" type="password" required minLength={6} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Xác nhận</button>
              <button type="button" onClick={() => setResettingUser(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
            </div>
          </form>
        </ModalBackdrop>
      )}

      {/* MODAL XOÁ */}
      {deletingUser && (
        <ModalBackdrop onClose={() => setDeletingUser(null)}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: '#ef4444' }}>
            Xác nhận xóa tài khoản
          </h3>
          <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingUser.full_name} ({deletingUser.code})</strong> không? Biện pháp này sẽ xóa toàn bộ dữ liệu hồ sơ và không thể hoàn tác.
          </p>
          <form onSubmit={handleDeleteUser} style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Xóa vĩnh viễn</button>
            <button type="button" onClick={() => setDeletingUser(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
          </form>
        </ModalBackdrop>
      )}

      <div className={styles.tableCard} style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setActiveTab('STUDENT'); setCohortFilter('ALL'); setClassFilter('ALL'); }}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'STUDENT' ? '2px solid #0d6efd' : '2px solid transparent',
              color: activeTab === 'STUDENT' ? '#0d6efd' : '#495057',
              fontWeight: activeTab === 'STUDENT' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>Sinh viên ({students.length})</button>
          <button 
            onClick={() => setActiveTab('LECTURER')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'LECTURER' ? '2px solid #0d6efd' : '2px solid transparent',
              color: activeTab === 'LECTURER' ? '#0d6efd' : '#495057',
              fontWeight: activeTab === 'LECTURER' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>Giảng viên ({lecturers.length})</button>
          <button 
            onClick={() => setActiveTab('ADMIN')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'ADMIN' ? '2px solid #0d6efd' : '2px solid transparent',
              color: activeTab === 'ADMIN' ? '#0d6efd' : '#495057',
              fontWeight: activeTab === 'ADMIN' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>Quản trị viên ({admins.length})</button>
        </div>

        {activeTab === 'STUDENT' && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Lọc theo khóa:</label>
              <select 
                value={cohortFilter} 
                onChange={e => setCohortFilter(e.target.value)}
                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #ced4da', minWidth: '150px' }}
              >
                <option value="ALL">Tất cả ({students.length})</option>
                {uniqueCohorts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>Lớp sinh viên:</label>
              <select 
                value={classFilter} 
                onChange={e => setClassFilter(e.target.value)}
                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #ced4da', minWidth: '150px' }}
              >
                <option value="ALL">Tất cả</option>
                {studentClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Họ Tên</th>
                <th>Email</th>
                {activeTab === 'STUDENT' && <th>Lớp</th>}
                {activeTab === 'STUDENT' && <th>Khóa</th>}
                {activeTab === 'STUDENT' && <th>Ngày sinh</th>}
                {activeTab === 'STUDENT' && <th>Giới tính</th>}
                {activeTab === 'STUDENT' && <th>Quê quán</th>}
                {(activeTab === 'LECTURER' || activeTab === 'STUDENT') && <th>Khoa / Đơn vị</th>}
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.code}</strong></td>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  {activeTab === 'STUDENT' && <td>{user.student_classes?.name || '-'}</td>}
                  {activeTab === 'STUDENT' && <td>{user.cohort || '-'}</td>}
                  {activeTab === 'STUDENT' && <td>{user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '-'}</td>}
                  {activeTab === 'STUDENT' && <td>{user.gender || '-'}</td>}
                  {activeTab === 'STUDENT' && <td>{user.hometown || '-'}</td>}
                  {(activeTab === 'LECTURER' || activeTab === 'STUDENT') && <td style={{color: '#0ea5e9', fontWeight: 500}}>{user.departments?.name || '-'}</td>}
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setEditingUser(user)} style={{ padding: '0.375rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>Sửa</button>
                      <button onClick={() => setResettingUser(user)} style={{ padding: '0.375rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>Reset Pass</button>
                      <button onClick={() => setDeletingUser(user)} style={{ padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedUsers.length === 0 && (
                <tr>
                  <td colSpan={10} style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
                    Chưa có dữ liệu nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
