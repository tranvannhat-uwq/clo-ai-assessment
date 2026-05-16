'use client'

import { useState, useMemo } from 'react'
import { updateProgressScore } from '@/actions/lecturer/scores'
import { formatScheduleList } from '@/lib/utils'
import styles from '../page.module.css'

export function ScoresClient({
  classes,
  students,
  clos,
  progressData,
  sessions,
}: {
  classes: any[]
  students: any[]
  clos: any[]
  progressData: any[]
  sessions: any[]
}) {
  const semesters = Array.from(new Set(classes.map(c => c.semester))).sort()
  const [semester, setSemester] = useState(semesters[0] || '')
  const availableClasses = useMemo(() => classes.filter(c => c.semester === semester), [classes, semester])
  const [selectedClassId, setSelectedClassId] = useState(availableClasses[0]?.id || '')
  const selectedClass = useMemo(() => availableClasses.find(c => c.id === selectedClassId), [availableClasses, selectedClassId])

  // Students cho class được chọn
  const filteredStudents = useMemo(() => {
    if (!selectedClass?.student_class_id) return []
    return students.filter(s => s.student_class_id === selectedClass.student_class_id)
  }, [students, selectedClass])

  // CLOs cho course được chọn
  const courseClos = useMemo(() => {
    if (!selectedClass) return []
    return clos.filter(c => c.course_id === selectedClass.course_id)
  }, [clos, selectedClass])

  // Progress map: studentId_cloId -> status
  const progressMap = useMemo(() => {
    const map = new Map<string, string>()
    progressData.forEach(p => {
      map.set(`${p.student_id}_${p.clo_id}`, p.status)
    })
    return map
  }, [progressData])

  // Sessions count per student in this class
  const sessionCountMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!selectedClass) return map
    sessions
      .filter(s => s.class_id === selectedClass.id)
      .forEach(s => {
        map.set(s.student_id, (map.get(s.student_id) || 0) + 1)
      })
    return map
  }, [sessions, selectedClass])

  // Detail modal
  const [detailStudent, setDetailStudent] = useState<any | null>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleToggleScore = async (studentId: string, cloId: string) => {
    const key = `${studentId}_${cloId}`
    const current = progressMap.get(key)
    const newStatus = current === 'PASSED' ? 'PENDING' : 'PASSED'
    setEditingCell(key)
    setSaving(true)
    await updateProgressScore(studentId, cloId, newStatus)
    // optimistic update
    progressMap.set(key, newStatus)
    setSaving(false)
    setEditingCell(null)
  }

  // CSV Export
  const exportCSV = () => {
    if (!selectedClass || filteredStudents.length === 0) return
    const headers = ['Mã SV', 'Họ tên', ...courseClos.map(c => c.code), 'Số lần thi']
    const rows = filteredStudents.map(student => {
      const cloStatuses = courseClos.map(clo => {
        const status = progressMap.get(`${student.id}_${clo.id}`)
        return status === 'PASSED' ? 'Đạt' : 'Chưa đạt'
      })
      const sessCount = sessionCountMap.get(student.id) || 0
      return [student.code, student.full_name, ...cloStatuses, sessCount]
    })
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bang_diem_${selectedClass.courses?.code}_${semester}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Student detail sessions
  const studentSessions = useMemo(() => {
    if (!detailStudent || !selectedClass) return []
    return sessions.filter(s => s.student_id === detailStudent.id && s.class_id === selectedClass.id)
  }, [sessions, detailStudent, selectedClass])

  return (
    <div>
      <h1 className={styles.title}>Quản lý Điểm số</h1>
      <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '1.05rem' }}>
        Xem bảng điểm, sửa điểm thủ công và xuất bảng điểm CSV cho từng lớp học phần.
      </p>

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Học kỳ:</label>
          <select
            value={semester}
            onChange={e => { setSemester(e.target.value); setSelectedClassId('') }}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          >
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            {semesters.length === 0 && <option value="">-- Trống --</option>}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Lớp học phần:</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          >
            <option value="">-- Chọn lớp --</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courses?.name} {c.student_classes?.name ? `- ${c.student_classes.name}` : '(Chung)'}
                {c.schedule ? ` [${formatScheduleList(c.schedule)}]` : ''}
              </option>
            ))}
          </select>
        </div>
        {selectedClass && filteredStudents.length > 0 && (
          <button
            onClick={exportCSV}
            style={{ marginLeft: 'auto', padding: '0.4rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            📥 Xuất CSV
          </button>
        )}
      </div>

      {/* Bảng điểm */}
      <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
        {!selectedClass ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
            Vui lòng chọn lớp học phần để xem bảng điểm.
          </div>
        ) : !selectedClass.student_class_id ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
            Lớp học phần này là lớp Dạy chung, không có danh sách sinh viên cố định.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
            Chưa có sinh viên nào trong lớp <strong>{selectedClass.student_classes?.name}</strong>.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={thStyle}>Mã SV</th>
                  <th style={thStyle}>Họ và Tên</th>
                  {courseClos.map(clo => (
                    <th key={clo.id} style={{ ...thStyle, textAlign: 'center', minWidth: '80px' }}>
                      <span title={clo.content}>{clo.code}</span>
                    </th>
                  ))}
                  <th style={{ ...thStyle, textAlign: 'center' }}>Số lần thi</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}><strong>{student.code}</strong></td>
                    <td style={tdStyle}>{student.full_name}</td>
                    {courseClos.map(clo => {
                      const key = `${student.id}_${clo.id}`
                      const status = progressMap.get(key)
                      const isPassed = status === 'PASSED'
                      const isEditing = editingCell === key
                      return (
                        <td key={clo.id} style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleScore(student.id, clo.id)}
                            disabled={isEditing && saving}
                            title={isPassed ? 'Click để đổi thành Chưa đạt' : 'Click để đổi thành Đạt'}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '999px',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              background: isPassed ? '#dcfce7' : '#fef3c7',
                              color: isPassed ? '#16a34a' : '#d97706',
                              opacity: isEditing ? 0.5 : 1,
                            }}
                          >
                            {isEditing ? '...' : isPassed ? 'Đạt' : 'Chưa đạt'}
                          </button>
                        </td>
                      )
                    })}
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>
                      {sessionCountMap.get(student.id) || 0}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => setDetailStudent(student)}
                        style={{ color: '#3b82f6', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Xem bài làm →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi tiết bài làm */}
      {detailStudent && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setDetailStudent(null) }}
        >
          <div style={{ background: 'white', borderRadius: '0.75rem', width: '90%', maxWidth: '650px', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem' }}>Chi tiết bài làm</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  {detailStudent.code} – {detailStudent.full_name}
                </p>
              </div>
              <button onClick={() => setDetailStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            {studentSessions.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                Sinh viên này chưa có phiên thi nào trong lớp học phần này.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {studentSessions.map((sess: any, idx: number) => (
                  <div key={sess.id} style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Phiên #{studentSessions.length - idx}</span>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: sess.status === 'COMPLETED' ? '#dcfce7' : sess.status === 'LOCKED' ? '#fee2e2' : '#fef3c7',
                        color: sess.status === 'COMPLETED' ? '#16a34a' : sess.status === 'LOCKED' ? '#dc2626' : '#d97706',
                      }}>
                        {sess.status === 'COMPLETED' ? 'Hoàn thành' : sess.status === 'LOCKED' ? 'Bị khóa' : 'Đang làm'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      <span>Hình thức: <strong>{sess.exam_mode || 'ORAL'}</strong></span>
                      <span style={{ marginLeft: '1rem' }}>Bắt đầu: {new Date(sess.start_time).toLocaleString('vi-VN')}</span>
                      {sess.end_time && <span style={{ marginLeft: '1rem' }}>Kết thúc: {new Date(sess.end_time).toLocaleString('vi-VN')}</span>}
                    </div>
                    {sess.session_questions && sess.session_questions.length > 0 && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#475569' }}>Số câu hỏi: <strong>{sess.session_questions.length}</strong></span>
                        {' • '}
                        <span style={{ color: '#16a34a' }}>Đúng: <strong>{sess.session_questions.filter((q: any) => q.is_correct).length}</strong></span>
                        {' • '}
                        <span style={{ color: '#dc2626' }}>Sai: <strong>{sess.session_questions.filter((q: any) => q.is_correct === false).length}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left',
  fontWeight: 600,
  color: '#475569',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  color: '#334155',
  fontSize: '0.9rem',
}
