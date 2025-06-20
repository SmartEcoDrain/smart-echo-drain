import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Smart Echo Drain',
  description: 'Sign in to your Smart Echo Drain account to access your dashboard and monitor your drainage system.',
  keywords: ['sign in', 'login', 'smart drain', 'water monitoring', 'flood prevention'],
  openGraph: {
    title: 'Sign In - Smart Echo Drain',
    description: 'Access your Smart Echo Drain monitoring dashboard',
    type: 'website',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  )
}