import { redirect } from 'next/navigation'

// Root redirects to admin — the actual entry points are /admin and /journey/[token]
export default function HomePage() {
  redirect('/admin')
}
