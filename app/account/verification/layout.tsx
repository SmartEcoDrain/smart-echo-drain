import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Verification - Smart Echo Drain',
  description: 'Verify your email address to complete your Smart Echo Drain account setup.',
  keywords: ['email verification', 'account verification', 'smart drain'],
  openGraph: {
    title: 'Email Verification - Smart Echo Drain',
    description: 'Complete your account setup by verifying your email address',
    type: 'website',
  },
}

export default function VerificationLayout({
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