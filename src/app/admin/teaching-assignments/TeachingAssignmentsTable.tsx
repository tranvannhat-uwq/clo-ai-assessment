'use client'

import { useMemo, useState } from 'react'
import styles from '../users/page.module.css'
import { CourseLecturerTemplateForm } from '../courses/CourseLecturerTemplateForm'

export function TeachingAssignmentsTable({
  templates,
  courses,
  lecturers
}: {
  templates: any[]
  courses: any[]
  lecturers: any[]
}) {
  const [activeCourseId, setActiveCourseId] = useState<string>('ALL')
  const [activeSemester, setActiveSemester] = useState<string>('ALL')
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editingSemester, setEditingSemester] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const semesters = useMemo(
    () => Array.from(new Set(templates.map(t => t.semester).filter(Boolean))) as string[],
    [templates]
  )

  const filteredTemplates = useMemo(
    () =>
      templates.filter(t => {
        if (activeCourseId !== 'ALL' && t.course_id !== activeCourseId) return false
        if (activeSemester !== 'ALL' && t.semester !== activeSemester) return false
        return true
      }),
    [templates, activeCourseId, activeSemester]
  )

  const groupedByCourse = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const t of filteredTemplates) {
      const key = t.course_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return Array.from(map.values())
  }, [filteredTemplates])

  const formatScheduleList = (str: string) => {
    if (!str) return 'Chưa gán'
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) {
        return parsed
          .map((p: any) => {
            if (p.date) return `${p.date} (${p.startPeriod}-${p.endPeriod})`
            return `T${p.dayOfWeek || '?'} (${p.startPeriod}-${p.endPeriod})`
          })
          .join(', ')
      }
    } catch {
      return str
    }
    return str
  }

  return (
    <div className={styles.tableCard}>
      <h2 style={{ marginBottom: '1rem' }}>Danh sách phân công lịch giảng dạy</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Môn học:</span>
          <select
            value={activeCourseId}
            onChange={e => setActiveCourseId(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          >
            <option value="ALL">-- Tất cả --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Học kỳ:</span>
          <select
            value={activeSemester}
            onChange={e => setActiveSemester(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          >
            <option value="ALL">-- Tất cả --</option>
            {semesters.map(sem => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          className={styles.submitBtn}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          onClick={() => {
            setEditingCourseId(null)
            setEditingSemester(null)
            setShowModal(true)
          }}
        >
          + Thêm / chỉnh sửa phân công
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Môn học</th>
              <th>Các học kỳ & Giảng viên</th>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {group.map((t: any) => (
                        <div key={t.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.semester}</span>
                          <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1e3a8a' }}>
                            {t.profiles?.full_name}
                            {t.profiles?.departments?.name && (
                              <span style={{ color: '#64748b' }}> ({t.profiles.departments.name})</span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                            {formatScheduleList(t.schedule)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.submitBtn}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => {
                        setEditingCourseId(first.course_id)
                        setEditingSemester(first.semester)
                        setShowModal(true)
                      }}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              )
            })}
            {groupedByCourse.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Chưa có cấu hình phân công nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
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
            if (e.target === e.currentTarget) setShowModal(false)
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
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>
            <CourseLecturerTemplateForm
              courses={courses}
              lecturers={lecturers}
              templates={templates}
              defaultCourseId={editingCourseId || undefined}
              defaultSemester={editingSemester || undefined}
              onSuccess={() => {
                setShowModal(false)
                window.location.reload()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

