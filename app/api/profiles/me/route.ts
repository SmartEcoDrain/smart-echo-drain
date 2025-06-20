import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use the RPC function to get full profile
    const { data, error } = await supabase
      .rpc('get_full_profile', {
        user_id: user.id
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: error.message },
        { status: 500 }
      )
    }

    // If no data returned, profile doesn't exist
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data[0],
      auth_user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}