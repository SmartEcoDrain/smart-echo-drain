"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid verification link. Missing token or email.')
      setLoading(false)
      return
    }

    verifyEmail()
  }, [token, email])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed')
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/account/login?message=Email verified successfully! Please log in.')
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email verification failed')
    } finally {
      setLoading(false)
    }
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
            <div className="mx-auto mb-4 p-3 rounded-full w-fit">
              {loading && (
                <div className="bg-primary/10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}
              {success && (
                <div className="bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              )}
              {error && (
                <div className="bg-red-100">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold text-gradient">
              {loading && 'Verifying Your Email...'}
              {success && 'Email Verified!'}
              {error && 'Verification Failed'}
            </CardTitle>
            
            <CardDescription className="text-muted-foreground">
              {loading && 'Please wait while we verify your email address'}
              {success && 'Your email has been successfully verified'}
              {error && 'There was a problem verifying your email'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status Messages */}
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-500/50 bg-green-50 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Your email has been verified successfully! You will be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Verifying your email address...</p>
              </div>
            )}

            {/* Action Buttons */}
            {(success || error) && (
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/account/login')}
                  className="w-full btn-gradient hover:shadow-lg transition-all duration-300"
                >
                  Continue to Login
                </Button>

                {error && (
                  <Button 
                    onClick={() => router.push('/account/verification')}
                    variant="outline"
                    className="w-full"
                  >
                    Request New Verification Email
                  </Button>
                )}
              </div>
            )}

            {/* Help Text */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help? Contact our support team
                </p>
                <Link 
                  href="mailto:support@smartechodrain.com" 
                  className="text-primary hover:text-primary/80 text-sm transition-colors"
                >
                  support@smartechodrain.com
                </Link>
              </div>
            )}
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