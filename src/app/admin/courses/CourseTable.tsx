'use client'
import { useMemo, useState } from 'react'
import { deleteCourse, updateCourse } from '@/actions/admin/courses'
import { deleteMultipleClasses } from '@/actions/admin/classes'
import { CourseForm } from './CourseForm'
import { CourseLecturerTemplateForm } from './CourseLecturerTemplateForm'
import styles from '../users/page.module.css'

export function CourseTable({ courses, lecturers, templates }: { courses: any[]; lecturers: any[]; templates: any[] }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'COURSES' | 'TEACHING'>('COURSES')
  const [activeCourseId, setActiveCourseId] = useState<string>('ALL')
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [showTeachingModal, setShowTeachingModal] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      await deleteCourse(id)
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCourse) return
    const formData = new FormData(e.currentTarget)
    formData.append('id', editingCourse.id)
    await updateCourse(formData)
    setEditingCourse(null)
  }

  const ModalBackdrop = ({ children, onClose }: any) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
        {children}
      </div>
    </div>
  )

  const filteredTemplates = useMemo(
    () =>
      (templates || []).filter((t: any) => {
        if (activeCourseId !== 'ALL' && t.course_id !== activeCourseId) return false
        return true
      }),
    [templates, activeCourseId]
  )

  const handleDeleteTemplate = async (courseId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phân công của môn này?')) {
      const toDelete = templates.filter(t => t.course_id === courseId).map(t => t.id)
      if (toDelete.length > 0) {
        await deleteMultipleClasses(toDelete)
      }
    }
  }
  const groupedByCourse = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const t of filteredTemplates) {
      const key = t.course_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return Array.from(map.values())
  }, [filteredTemplates])

  return (
      <div className={styles.tableCard} style={{ width: '100%' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('COURSES')}
            style={{
              background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
              fontSize: '1.05rem', fontWeight: activeTab === 'COURSES' ? 700 : 500,
              color: activeTab === 'COURSES' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'COURSES' ? '3px solid #3b82f6' : '3px solid transparent'
            }}
          >
            📚 Danh sách Môn học
          </button>
          <button
            onClick={() => setActiveTab('TEACHING')}
            style={{
              background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
              fontSize: '1.05rem', fontWeight: activeTab === 'TEACHING' ? 700 : 500,
              color: activeTab === 'TEACHING' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'TEACHING' ? '3px solid #10b981' : '3px solid transparent'
            }}
          >
            🗓️ Phân công lịch giảng dạy
          </button>
        </div>

        {activeTab === 'COURSES' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Danh sách Môn học</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className={styles.submitBtn}
                style={{ margin: 0, padding: '0.5rem 1rem' }}
              >
                + Thêm Môn học mới
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã Môn</th>
                    <th>Tên Môn</th>
                    <th>Tín chỉ</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {courses?.map(course => (
                    <tr key={course.id}>
                      <td><strong>{course.code}</strong></td>
                      <td>{course.name}</td>
                      <td>{course.credits}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setEditingCourse(course)} className={styles.submitBtn} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', background: '#10b981', margin: 0 }}>Sửa</button>
                          <button onClick={() => handleDelete(course.id)} className={styles.deleteBtn} style={{ margin: 0 }}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!courses || courses.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        Chưa có dữ liệu. Hãy thêm môn học mới!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'TEACHING' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Phân công lịch giảng dạy</h2>
              <button
                className={styles.submitBtn}
                style={{ margin: 0, padding: '0.5rem 1rem' }}
                onClick={() => {
                  setEditingCourseId(null)
                  setShowTeachingModal(true)
                }}
              >
                + Thêm / chỉnh sửa phân công
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Môn học:</span>
                <select value={activeCourseId} onChange={e => setActiveCourseId(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                  <option value="ALL">-- Tất cả --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th>Giảng viên</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByCourse.map(group => {
                    const first = group[0]
                    return (
                      <tr key={first.course_id}>
                        <td>
                          <strong>{first.courses?.code}</strong> - {first.courses?.name}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {group.map((t: any) => (
                              <div key={t.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1e3a8a' }}>
                                  {t.profiles?.full_name}
                                  {t.profiles?.departments?.name && <span style={{ color: '#64748b' }}> ({t.profiles.departments.name})</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className={styles.submitBtn}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', background: '#10b981', margin: 0 }}
                              onClick={() => {
                                setEditingCourseId(first.course_id)
                                setShowTeachingModal(true)
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              className={styles.deleteBtn}
                              style={{ margin: 0 }}
                              onClick={() => handleDeleteTemplate(first.course_id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {groupedByCourse.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        Chưa có cấu hình phân công nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showTeachingModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={e => {
                  if (e.target === e.currentTarget) setShowTeachingModal(false)
                }}
              >
                <div
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    width: '95%',
                    maxWidth: '720px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 10px 25px rgba(15,23,42,0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>
                      {editingCourseId ? 'Sửa phân công theo Môn / Học kỳ' : 'Thêm phân công lịch giảng dạy'}
                    </h3>
                    <button type="button" onClick={() => setShowTeachingModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>
                      &times;
                    </button>
                  </div>
                  <CourseLecturerTemplateForm
                    courses={courses}
                    lecturers={lecturers}
                    templates={templates}
                    defaultCourseId={editingCourseId || undefined}
                    onSuccess={() => {
                      setShowTeachingModal(false)
                      window.location.reload()
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      {showAddModal && (
        <ModalBackdrop onClose={() => setShowAddModal(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Thêm Môn học mới</h3>
            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, color: '#64748b' }}>&times;</button>
          </div>
          <CourseForm onSuccess={() => setShowAddModal(false)} />
        </ModalBackdrop>
      )}

      {editingCourse && (
        <ModalBackdrop onClose={() => setEditingCourse(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Sửa thông tin Môn học</h3>
            <button onClick={() => setEditingCourse(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, color: '#64748b' }}>&times;</button>
          </div>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Mã môn học</label>
              <input name="code" defaultValue={editingCourse.code} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc', background: '#f8fafc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Tên môn học</label>
              <input name="name" defaultValue={editingCourse.name} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc', background: '#f8fafc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Số tín chỉ</label>
              <input name="credits" type="number" min="1" max="10" defaultValue={editingCourse.credits} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc', background: '#f8fafc' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" style={{ flex: 1, padding: '0.85rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Lưu thay đổi</button>
              <button type="button" onClick={() => setEditingCourse(null)} style={{ flex: 1, padding: '0.85rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
            </div>
          </form>
        </ModalBackdrop>
      )}
    </div>
  )
}
