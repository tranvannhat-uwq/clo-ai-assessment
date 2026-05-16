'use client'
import { useState } from 'react'
import { ClassSubjectsForm } from './ClassSubjectsForm'
import { AssignLecturersForm } from './AssignLecturersForm'
import { WeeklyScheduleForm } from './WeeklyScheduleForm'
import { ClassListTable } from './ClassListTable'
import styles from '../users/page.module.css'

export function ClassManagementTabs({ courses, lecturers, studentClasses, classes, courseLecturerTemplates, classSubjects, studentCountByClassId }: any) {
  const [activeTab, setActiveTab] = useState<'LIST' | 'SUBJECTS' | 'ASSIGN' | 'SCHEDULE'>('LIST')
  const [focusStudentClassId, setFocusStudentClassId] = useState<string>('')
  const [focusSemester, setFocusSemester] = useState<string>('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '2rem' }}>
        <button
          onClick={() => setActiveTab('LIST')}
          style={{
            background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
            fontSize: '1.05rem', fontWeight: activeTab === 'LIST' ? 700 : 500,
            color: activeTab === 'LIST' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'LIST' ? '3px solid #3b82f6' : '3px solid transparent'
          }}
        >
          📂 Danh sách Phân công
        </button>
        <button
          onClick={() => setActiveTab('SUBJECTS')}
          style={{
            background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
            fontSize: '1.05rem', fontWeight: activeTab === 'SUBJECTS' ? 700 : 500,
            color: activeTab === 'SUBJECTS' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'SUBJECTS' ? '3px solid #10b981' : '3px solid transparent'
          }}
        >
          📝 Gán môn cho Lớp
        </button>
        <button
          onClick={() => setActiveTab('ASSIGN')}
          style={{
            background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
            fontSize: '1.05rem', fontWeight: activeTab === 'ASSIGN' ? 700 : 500,
            color: activeTab === 'ASSIGN' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'ASSIGN' ? '3px solid #14b8a6' : '3px solid transparent'
          }}
        >
          👨‍🏫 Phân công Giảng viên
        </button>
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          style={{
            background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
            fontSize: '1.05rem', fontWeight: activeTab === 'SCHEDULE' ? 700 : 500,
            color: activeTab === 'SCHEDULE' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'SCHEDULE' ? '3px solid #6366f1' : '3px solid transparent'
          }}
        >
          🗓️ Xếp lịch tuần
        </button>
      </div>

      <div>
        {activeTab === 'LIST' && (
          <ClassListTable
            classSubjects={classSubjects || []}
            lecturers={lecturers || []}
            studentClasses={studentClasses || []}
            courses={courses || []}
            studentCountByClassId={studentCountByClassId || {}}
            onView={(studentClassId: string, semester: string) => {
              setFocusStudentClassId(studentClassId)
              setFocusSemester(semester)
            }}
            onEdit={(studentClassId: string, semester: string) => {
              setFocusStudentClassId(studentClassId)
              setFocusSemester(semester)
              setActiveTab('ASSIGN')
            }}
          />
        )}
        {activeTab === 'SUBJECTS' && (
          <div className={styles.formCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Gán môn học cho các Lớp trong Học kỳ</h2>
            <ClassSubjectsForm courses={courses || []} studentClasses={studentClasses || []} />
          </div>
        )}
        {activeTab === 'ASSIGN' && (
          <div className={styles.formCard} style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2>Phân công giảng viên cho từng Lớp</h2>
            <AssignLecturersForm
              studentClasses={studentClasses || []}
              classSubjects={classSubjects || []}
              courses={courses || []}
              courseLecturerTemplates={courseLecturerTemplates || []}
              defaultStudentClassId={focusStudentClassId || undefined}
              defaultSemester={focusSemester || undefined}
            />
          </div>
        )}
        {activeTab === 'SCHEDULE' && (
          <div className={styles.formCard} style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2>Xếp thời khóa biểu theo tuần cho Lớp</h2>
            <WeeklyScheduleForm
              studentClasses={studentClasses || []}
              classSubjects={classSubjects || []}
              courses={courses || []}
              defaultStudentClassId={focusStudentClassId || undefined}
              defaultSemester={focusSemester || undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}
