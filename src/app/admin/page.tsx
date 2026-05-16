import { supabaseAdmin } from '@/lib/supabase-admin'
import { Users, GraduationCap, BookOpen, Layers, BarChart3, TrendingUp } from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboard() {
  const [
    { count: studentCount },
    { count: lecturerCount },
    { count: courseCount },
    { count: classCount },
    { data: students },
    { data: studentClasses }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'LECTURER'),
    supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('student_class_id').eq('role', 'STUDENT'),
    supabaseAdmin.from('student_classes').select('id, cohort')
  ])

  const cohortMap = new Map<string, string>()
  studentClasses?.forEach((sc: any) => cohortMap.set(sc.id, sc.cohort))

  const cohortCounts: Record<string, number> = {}
  students?.forEach((s: any) => {
    if (!s.student_class_id) {
      cohortCounts['Chưa xếp lớp'] = (cohortCounts['Chưa xếp lớp'] || 0) + 1
      return
    }
    const cohort = cohortMap.get(s.student_class_id) || 'Khác'
    cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1
  })

  const sortedCohorts = Object.entries(cohortCounts).sort((a, b) => {
    if (a[0] === 'Chưa xếp lớp' || a[0] === 'Khác') return 1
    if (b[0] === 'Chưa xếp lớp' || b[0] === 'Khác') return -1
    return a[0].localeCompare(b[0])
  })

  const maxCohortCount = Math.max(...Object.values(cohortCounts), 1)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
          <TrendingUp size={28} />
        </div>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1rem', fontWeight: 500 }}>Tổng quan tình hình hoạt động của hệ thống</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#1e40af', fontWeight: 600, fontSize: '1.1rem' }}>Sinh viên</span>
            <div style={{ background: '#bfdbfe', padding: '0.6rem', borderRadius: '50%', color: '#1d4ed8' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1 }}>{studentCount || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 500 }}>Đã đăng ký hệ thống</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#166534', fontWeight: 600, fontSize: '1.1rem' }}>Giảng viên</span>
            <div style={{ background: '#bbf7d0', padding: '0.6rem', borderRadius: '50%', color: '#15803d' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#14532d', lineHeight: 1 }}>{lecturerCount || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 500 }}>Đang giảng dạy</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#92400e', fontWeight: 600, fontSize: '1.1rem' }}>Môn học</span>
            <div style={{ background: '#fde68a', padding: '0.6rem', borderRadius: '50%', color: '#b45309' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#78350f', lineHeight: 1 }}>{courseCount || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 500 }}>Chương trình đào tạo</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#6b21a8', fontWeight: 600, fontSize: '1.1rem' }}>Lớp học phần</span>
            <div style={{ background: '#e9d5ff', padding: '0.6rem', borderRadius: '50%', color: '#7e22ce' }}>
              <Layers size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#581c87', lineHeight: 1 }}>{classCount || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 500 }}>Được mở trong kỳ</div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <BarChart3 size={24} color="#4f46e5" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Thống kê Sinh viên theo Khóa</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sortedCohorts.length > 0 ? (
              sortedCohorts.map(([cohort, count]) => {
                const percentage = Math.round((count / maxCohortCount) * 100)
                return (
                  <div key={cohort} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.95rem' }}>{cohort}</div>
                    <div style={{ height: '1.5rem', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${percentage}%`, 
                          background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                          borderRadius: '999px',
                          transition: 'width 1s ease-out'
                        }} 
                      />
                    </div>
                    <div style={{ fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>{count}</div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>Chưa có dữ liệu sinh viên</div>
            )}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: '1.5rem' }}>Tính năng quản trị nhanh</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <a href="/admin/student-classes" style={{ display: 'block', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textDecoration: 'none', color: '#334155', border: '1px solid #e2e8f0', transition: 'all 0.2s', fontWeight: 500 }}>
              🏢 Quản lý Lớp hành chính &amp; Khóa
            </a>
            <a href="/admin/courses" style={{ display: 'block', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textDecoration: 'none', color: '#334155', border: '1px solid #e2e8f0', transition: 'all 0.2s', fontWeight: 500 }}>
              📚 Quản lý Môn học &amp; Cấu hình CLO
            </a>
            <a href="/admin/classes" style={{ display: 'block', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textDecoration: 'none', color: '#334155', border: '1px solid #e2e8f0', transition: 'all 0.2s', fontWeight: 500 }}>
              📅 Phân công giảng dạy &amp; Xếp thời khóa biểu
            </a>
            <a href="/admin/users" style={{ display: 'block', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', textDecoration: 'none', color: '#334155', border: '1px solid #e2e8f0', transition: 'all 0.2s', fontWeight: 500 }}>
              👥 Quản lý Người dùng hệ thống
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
