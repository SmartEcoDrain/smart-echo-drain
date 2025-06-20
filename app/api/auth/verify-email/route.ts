import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface VerifyEmailRequest {
  token: string
  email: string
}

// POST: Verify email with token
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

    // Verify the email with the token
    const { data, error } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.token,
      type: 'signup'
    })

    if (error) {
      return NextResponse.json(
        { error: 'Email verification failed', details: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Verification failed - user not found' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: true
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}