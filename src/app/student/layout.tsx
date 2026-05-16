import Link from 'next/link'
import styles from '../admin/layout.module.css'
import { logout } from '@/actions/auth'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar} style={{backgroundColor: '#1e3a8a'}}>
        <div className={styles.logo} style={{color: '#bfdbfe'}}>Portal Sinh Viên</div>
        <nav className={styles.nav}>
          <Link href="/student">🏠 Lịch học & Lớp học</Link>
          <Link href="/student/schedule">📅 Thời Khóa Biểu</Link>
          <Link href="/student/results">📈 Kết quả & Tiến độ</Link>
          <Link href="/student/profile">👤 Tài khoản cá nhân</Link>
        </nav>
        <form action={logout} className={styles.logoutForm}>
          <button type="submit" style={{borderColor: '#1e40af', color: '#93c5fd', backgroundColor: 'transparent'}}>Đăng xuất</button>
        </form>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
