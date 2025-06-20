import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface VerifyEmailRequest {
  token: string
  email: string
}

// POST: Verify email with OTP token
export async function POST(request: NextRequest) {
  try {
    const body: VerifyEmailRequest = await request.json()
    
    if (!body.token || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: token, email' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the email with the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.token,
      type: 'email'  // Changed from 'signup' to 'email'
    })

    if (error) {
      console.error('OTP verification error:', error)
      return NextResponse.json(
        { error: 'Invalid or expired verification code', details: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Verification failed - user not found' },
        { status: 400 }
      )
    }

    // Update user profile if needed
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('uuid', data.user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: true
      },
      session: data.session
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}