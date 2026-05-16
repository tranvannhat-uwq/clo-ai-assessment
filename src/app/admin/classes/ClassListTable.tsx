'use client'

import { useState } from 'react'
import { deleteClassSemesterPlan } from '@/actions/admin/classes'
import styles from '../users/page.module.css'

function formatScheduleList(str: string) {
  if (!str) return 'Chưa gán'
  try {
    const parsed = JSON.parse(str)
    if (Array.isArray(parsed)) {
      return parsed
        .map(p => {
          let dateStr = ''
          if (p.date) {
            const parts = String(p.date).split('-')
            if (parts.length === 3) dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`
            else dateStr = p.date
          } else if (p.dayOfWeek) {
            const daysMap: any = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' }
            dateStr = daysMap[p.dayOfWeek] || ''
          }
          return `${dateStr} (${p.startPeriod}-${p.endPeriod})${p.room ? ` [${p.room}]` : ''}`
        })
        .join(', ')
    }
  } catch {
    return str
  }
  return str
}

export function ClassListTable({
  classSubjects,
  lecturers,
  studentClasses,
  courses,
  studentCountByClassId,
  onView,
  onEdit
}: {
  classSubjects: any[]
  lecturers: any[]
  studentClasses: any[]
  courses: any[]
  studentCountByClassId: Record<string, number>
  onView?: (studentClassId: string, semester: string) => void
  onEdit?: (studentClassId: string, semester: string) => void
}) {
  const [semesterFilter, setSemesterFilter] = useState('ALL')
  const [cohortFilter, setCohortFilter] = useState('ALL')
  const [viewing, setViewing] = useState<any | null>(null)
  const [deleting, setDeleting] = useState<any | null>(null)
  const [actionError, setActionError] = useState('')

  // Mảng lọc duy nhất cho dropdown
  const uniqueSemesters = Array.from(new Set(classSubjects.map(c => c.semester).filter(Boolean))) as string[]
  const uniqueCohorts = Array.from(new Set(studentClasses.map(c => c.cohort).filter(Boolean))) as string[]

  let filtered = classSubjects
  if (semesterFilter !== 'ALL') {
    filtered = filtered.filter(c => c.semester === semesterFilter)
  }
  if (cohortFilter !== 'ALL') {
    const classIds = new Set(studentClasses.filter(c => c.cohort === cohortFilter).map(c => c.id))
    filtered = filtered.filter(s => classIds.has(s.student_class_id))
  }

  // Group by student_class_id + semester
  const groupedMap = new Map<string, any>()
  for (const row of filtered) {
    const key = `${row.student_class_id}|${row.semester}`
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        student_class_id: row.student_class_id,
        semester: row.semester,
        subjects: []
      })
    }
    groupedMap.get(key).subjects.push(row)
  }
  const grouped = Array.from(groupedMap.values())
    .map(g => {
      const cls = studentClasses.find(c => c.id === g.student_class_id)
      return { ...g, classInfo: cls }
    })
    .sort((a, b) => String(b.semester).localeCompare(String(a.semester)))

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
        width: '95%', maxWidth: '850px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {children}
      </div>
    </div>
  )

  return (
    <div className={styles.tableCard}>
      <h2 style={{ marginBottom: '1rem' }}>Danh sách phân công theo Lớp</h2>

      {/* MODAL XÓA */}
      {deleting && (
        <ModalBackdrop onClose={() => { setDeleting(null); setActionError('') }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: '#ef4444' }}>
            Xác nhận xóa kế hoạch học kỳ của Lớp
          </h3>
          <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Hệ thống sẽ <strong>xóa toàn bộ</strong> môn, giảng viên và lịch của lớp <strong>{deleting?.classInfo?.name || 'N/A'}</strong> trong <strong>{deleting?.semester}</strong>. Bạn có chắc chắn?
          </p>
          {actionError && (
            <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid #fca5a5', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
              {actionError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={async () => {
                setActionError('')
                const res = await deleteClassSemesterPlan(deleting.student_class_id, deleting.semester)
                if (res && 'error' in res) setActionError(String(res.error))
                else setDeleting(null)
              }}
              style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Xóa vĩnh viễn
            </button>
            <button type="button" onClick={() => setDeleting(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>
              Hủy
            </button>
          </div>
        </ModalBackdrop>
      )}

      {/* MODAL XEM */}
      {viewing && (
        <ModalBackdrop onClose={() => setViewing(null)}>
          <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            Chi tiết lớp: <span style={{ color: '#0ea5e9' }}>{viewing?.classInfo?.name || 'N/A'}</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            Học kỳ: <strong>{viewing.semester}</strong> · Sĩ số: <strong>{studentCountByClassId[viewing.student_class_id] || 0}</strong>
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Giảng viên</th>
                  <th>Lịch học</th>
                </tr>
              </thead>
              <tbody>
                {viewing.subjects.map((s: any) => {
                  const course = courses.find((c: any) => c.id === s.course_id)
                  const lecturer = lecturers.find((l: any) => l.id === s.lecturer_id)
                  return (
                    <tr key={s.id}>
                      <td><strong>{course?.code}</strong> - {course?.name}</td>
                      <td>{lecturer?.full_name || 'Chưa gán'}</td>
                      <td>{s.schedule ? formatScheduleList(s.schedule) : 'Chưa xếp'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                onEdit?.(viewing.student_class_id, viewing.semester)
                setViewing(null)
              }}
              style={{ flex: 1, padding: '0.75rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sửa
            </button>
            <button type="button" onClick={() => setViewing(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>
              Đóng
            </button>
          </div>
        </ModalBackdrop>
      )}

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Lọc theo Học kỳ:</label>
          <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
            <option value="ALL">-- Tất cả Học kỳ --</option>
            {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Lọc theo Khóa:</label>
          <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
            <option value="ALL">-- Tất cả --</option>
            {uniqueCohorts.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Lớp</th>
              <th style={{ width: '15%' }}>Khóa</th>
              <th style={{ width: '15%' }}>Học kỳ</th>
              <th style={{ width: '35%' }}>Môn học & Giảng viên</th>
              <th style={{ width: '15%' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group: any, idx: number) => {
              const cls = group.classInfo
              return (
                <tr key={idx}>
                  <td><strong>{cls?.name || 'N/A'}</strong></td>
                  <td>{cls?.cohort || '-'}</td>
                  <td>{group.semester}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {group.subjects.slice(0, 4).map((s: any) => {
                        const course = courses.find((c: any) => c.id === s.course_id)
                        const lecturer = lecturers.find((l: any) => l.id === s.lecturer_id)
                        return (
                          <div key={s.id} style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{course?.code || 'Môn'}</span>
                            <span style={{ color: '#64748b' }}>-</span>
                            <span style={{ color: lecturer ? '#0f172a' : '#94a3b8' }}>{lecturer?.full_name || 'Chưa gán GV'}</span>
                          </div>
                        )
                      })}
                      {group.subjects.length > 4 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>+ {group.subjects.length - 4} môn khác…</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          onView?.(group.student_class_id, group.semester)
                          setViewing(group)
                        }}
                        style={{ padding: '0.35rem 0.75rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => onEdit?.(group.student_class_id, group.semester)}
                        style={{ padding: '0.35rem 0.75rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => {
                          setActionError('')
                          setDeleting(group)
                        }}
                        style={{ padding: '0.35rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {grouped.length === 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.05rem'}}>
                  Chưa có dữ liệu nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
