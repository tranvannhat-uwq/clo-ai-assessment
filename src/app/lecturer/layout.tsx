import Link from 'next/link'
import styles from '../admin/layout.module.css'
import { logout } from '@/actions/auth'

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Teacher Dashboard</div>
        <nav className={styles.nav}>
          <Link href="/lecturer">🏫 Lịch giảng dạy & Lớp học</Link>
          <Link href="/lecturer/courses">📚 Quản lý Đề thi & CLO</Link>
          <Link href="/lecturer/scores">📝 Quản lý Điểm số</Link>
          <Link href="/lecturer/progress">📈 Báo cáo & Tiến độ</Link>
          <Link href="/lecturer/profile">👤 Tài khoản cá nhân</Link>
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
