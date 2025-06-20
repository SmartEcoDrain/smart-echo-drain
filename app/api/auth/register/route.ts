import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RegisterRequest {
  email: string
  password: string
  full_name: string
  name?: {
    first_name?: string
    middle_name?: string
    last_name?: string
    suffix?: string
  }
  phone_number?: string
  address?: {
    region?: string
    province?: string
    city?: string
    barangay?: string
    street?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
}

// POST: User registration
export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    
    if (!body.email || !body.password || !body.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (minimum 6 characters)
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to create user account', details: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        uuid: authData.user.id,
        email: body.email,
        full_name: body.full_name,
        name: body.name || {},
        phone_number: body.phone_number,
        address: body.address || {},
        settings: {},
        is_admin: false
      })
      .select()
      .single()

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // But Supabase doesn't allow deleting users from client-side
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at,
        email_confirmed: authData.user.email_confirmed_at ? true : false
      },
      profile: profileData,
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      } : null
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}