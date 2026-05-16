'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatScheduleList } from '@/lib/utils'
import styles from '../page.module.css' 

export function ProgressClient({ classes, students }: { classes: any[], students: any[] }) {
  const semesters = Array.from(new Set(classes.map(c => c.semester)))
  const [semester, setSemester] = useState(semesters[0] || '')
  
  const availableClasses = useMemo(() => classes.filter(c => c.semester === semester), [classes, semester])
  const [selectedClassId, setSelectedClassId] = useState(availableClasses[0]?.id || '')

  const selectedClass = useMemo(() => availableClasses.find(c => c.id === selectedClassId), [availableClasses, selectedClassId])
  
  const filteredStudents = useMemo(() => {
    if (!selectedClass || !selectedClass.student_class_id) return []
    return students.filter(s => s.student_class_id === selectedClass.student_class_id)
  }, [students, selectedClass])

  return (
    <div>
      <h1 className={styles.title}>Theo dõi Tiến độ Điểm thi Sinh viên</h1>
      <p style={{marginBottom: '1rem', color: '#64748b', fontSize: '1.05rem'}}>Thống kê mức độ hoàn thành chuẩn đầu ra (CLO) của sinh viên trong các lớp.</p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Lọc Học kỳ:</label>
          <select value={semester} onChange={e => { setSemester(e.target.value); setSelectedClassId('') }} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            {semesters.length === 0 && <option value="">-- Trống --</option>}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Lớp Học phần (đã phân công):</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
            <option value="">-- Chọn một lớp học phần --</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courses.name} {c.student_classes?.name ? `- Lớp SV ${c.student_classes.name}` : '(Không gán Lớp SV)'} 
                {c.schedule ? ` [${formatScheduleList(c.schedule)}]` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.card} style={{padding: '0', overflow: 'hidden'}}>
        {!selectedClass ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '1.05rem'}}>
            Vui lòng chọn một lớp học phần ở khung lọc bên trên để xem danh sách sinh viên.
          </div>
        ) : !selectedClass.student_class_id ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '1.05rem'}}>
            Lớp học phần này (<i>{selectedClass.courses.name}</i>) là lớp Dạy chung (Không thuộc riêng một Lớp Hành chính nào). Xin vui lòng sử dụng chức năng Danh sách sinh viên theo Học phần nếu có.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '1.05rem'}}>
            Chưa có hồ sơ sinh viên nào nào đăng ký vào Lớp hành chính <strong>{selectedClass.student_classes.name}</strong>.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                <tr>
                  <th style={{padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase'}}>Mã SV</th>
                  <th style={{padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase'}}>Họ và Tên</th>
                  <th style={{padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase'}}>Môn / Lớp</th>
                  <th style={{padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase'}}>Trạng thái Đo lường</th>
                  <th style={{padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase'}}>Log Học tập</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student: any) => (
                  <tr key={student.id} style={{borderBottom: '1px solid #f1f5f9', transition: '0.2s'}}>
                    <td style={{padding: '1rem', color: '#334155'}}><strong>{student.code}</strong></td>
                    <td style={{padding: '1rem', color: '#1e293b', fontWeight: 500}}>{student.full_name}</td>
                    <td style={{padding: '1rem', color: '#475569'}}>{selectedClass.courses.name}</td>
                    <td style={{padding: '1rem'}}>
                      <span style={{color: '#d97706', background: '#fef3c7', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600}}>
                        Chưa thu thập
                      </span>
                    </td>
                    <td style={{padding: '1rem'}}>
                      <Link href={`/lecturer/progress/${student.id}?classId=${selectedClass.id}`} style={{color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'}}>
                        Xem Track Log &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
