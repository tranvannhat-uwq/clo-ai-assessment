import Link from 'next/link'
import styles from './layout.module.css'
import { logout } from '@/actions/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>CLO System Admin</div>
        <nav className={styles.nav}>
          <Link href="/admin">📊 Tổng quan</Link>
          <Link href="/admin/users">👥 Người dùng</Link>
          <Link href="/admin/departments">🏢 Khoa viện</Link>
          <Link href="/admin/courses">📚 Môn học</Link>
          <Link href="/admin/student-classes">🏫 Lớp hành chính</Link>
          <Link href="/admin/classes">🎓 Lớp học phần</Link>
          <Link href="/admin/settings">⚙️ Cấu hình AI</Link>
        </nav>
        <form action={logout} className={styles.logoutForm}>
          <button type="submit">Đăng xuất</button>
        </form>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
