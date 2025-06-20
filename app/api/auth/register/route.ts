import { createAdminClient } from '../../supabase/server'
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
  gender?: string
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

    const supabase = await createAdminClient()

    // Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/account/verify`
      }
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

    // Prepare profile data with proper defaults
    const profileData = {
      uuid: authData.user.id,
      email: body.email,
      full_name: body.full_name,
      name: body.name || {},
      phone_number: body.phone_number || null,
      address: body.address || {},
      gender: body.gender || null,
      settings: {},
      is_admin: false
    }

    // Create user profile with error handling
    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Try to clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at,
        email_confirmed: authData.user.email_confirmed_at ? true : false
      },
      profile: insertedProfile,
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      } : null,
      verification_required: !authData.user.email_confirmed_at
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}