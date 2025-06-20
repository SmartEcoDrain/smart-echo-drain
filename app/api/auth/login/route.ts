import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface LoginRequest {
  email: string
  password: string
}

// POST: User login
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .rpc('get_full_profile', {
        user_id: authData.user.id
      })

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at,
        last_sign_in_at: authData.user.last_sign_in_at
      },
      profile: profile && profile.length > 0 ? profile[0] : null,
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}