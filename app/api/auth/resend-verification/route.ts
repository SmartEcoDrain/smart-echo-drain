import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ResendVerificationRequest {
  email: string
}

// POST: Resend verification email
export async function POST(request: NextRequest) {
  try {
    const body: ResendVerificationRequest = await request.json()
    
    if (!body.email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: body.email
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to resend verification email', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}