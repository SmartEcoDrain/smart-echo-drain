import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RefreshRequest {
  refresh_token: string
}

// POST: Refresh authentication token
export async function POST(request: NextRequest) {
  try {
    const body: RefreshRequest = await request.json()
    
    if (!body.refresh_token) {
      return NextResponse.json(
        { error: 'Missing required field: refresh_token' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Refresh the session
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: body.refresh_token
    })

    if (refreshError) {
      return NextResponse.json(
        { error: 'Failed to refresh token', details: refreshError.message },
        { status: 401 }
      )
    }

    if (!sessionData.session || !sessionData.user) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Get updated user profile
    const { data: profile, error: profileError } = await supabase
      .rpc('get_full_profile', {
        user_id: sessionData.user.id
      })

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        created_at: sessionData.user.created_at,
        last_sign_in_at: sessionData.user.last_sign_in_at
      },
      profile: profile && profile.length > 0 ? profile[0] : null,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}