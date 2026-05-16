import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware handles most of the homepage logic by inspecting cookies.
  // In case token is missing and middleware passes down, redirect to login.
  redirect('/login')
}
