"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

function VerificationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      router.push('/account/login')
    }
  }, [email, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: otp, email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccess('Email verified successfully!')
      
      // Store session if provided
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token)
        localStorage.setItem('refresh_token', data.session.refresh_token)
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/account/login?message=Email verified successfully! Please log in.')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setSuccess('New verification code sent! Please check your email.')
      setResendCooldown(60) // 1 minute cooldown

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-accent p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Smart Echo Drain
          </h1>
          <p className="text-white/90 text-lg">
            Email Verification
          </p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">
              Enter Verification Code
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We've sent a 6-digit code to your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status Messages */}
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-500/50 bg-green-50 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{success}</AlertDescription>
              </Alert>
            )}

            {/* Email Display */}
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Verification code sent to:</p>
              <p className="font-medium text-foreground">{email}</p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="text-sm font-medium text-foreground/80">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-gradient hover:shadow-lg transition-all duration-300"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            {/* Instructions */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p>Check your email inbox for a 6-digit verification code</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p>Enter the code above to verify your email address</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p>Check your spam folder if you don't see the email</p>
              </div>
            </div>

            {/* Resend Button */}
            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Resend in {resendCooldown}s
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  'Resend Verification Code'
                )}
              </Button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-4">
              <Link 
                href="/account/login" 
                className="text-primary hover:text-primary/80 text-sm transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-white/60 text-sm">
            © 2025 Smart Echo Drain. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-accent p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <VerificationPageContent />
    </Suspense>
  )
}