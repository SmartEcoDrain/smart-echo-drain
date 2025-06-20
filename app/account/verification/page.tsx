"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function VerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

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

      setSuccess('Verification email sent! Please check your inbox.')
      setResendCooldown(60) // 1 minute cooldown

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  const checkVerificationStatus = async () => {
    if (!email) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/auth/check-verification?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check verification status')
      }

      if (data.verified) {
        router.push('/account/login?message=Email verified successfully! Please log in.')
      } else {
        setError('Email not yet verified. Please check your inbox.')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check verification status')
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
              Check Your Email
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We've sent a verification link to your email address
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
              <p className="text-sm text-muted-foreground mb-1">Verification email sent to:</p>
              <p className="font-medium text-foreground">{email}</p>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p>Check your email inbox for a verification message from Smart Echo Drain</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p>Click the verification link in the email to activate your account</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <p>Check your spam folder if you don't see the email</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={checkVerificationStatus}
                className="w-full btn-gradient hover:shadow-lg transition-all duration-300" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </div>
                ) : (
                  'I\'ve Verified My Email'
                )}
              </Button>

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
                  'Resend Verification Email'
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