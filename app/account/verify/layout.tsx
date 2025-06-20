import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email - Smart Echo Drain',
  description: 'Email verification in progress for your Smart Echo Drain account.',
  keywords: ['verify email', 'account activation', 'smart drain'],
  openGraph: {
    title: 'Verify Email - Smart Echo Drain',
    description: 'Verifying your email address for Smart Echo Drain',
    type: 'website',
  },
}

export default function VerifyLayout({
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