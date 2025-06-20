import { createClient } from '../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateProfileRequest {
  email?: string
  full_name?: string
  name?: {
    first_name?: string
    middle_name?: string
    last_name?: string
    suffix?: string
  }
  gender?: string
  birthday?: string
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
  settings?: Record<string, any>
  profile_image?: string
}

// GET: Get user's full profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    const supabase = await createClient()

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const target_user_id = user_id || user.id

    // Use the RPC function to get full profile
    const { data, error } = await supabase
      .rpc('get_full_profile', {
        user_id: target_user_id
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: error.message },
        { status: 500 }
      )
    }

    // If no data returned, user doesn't have permission or profile doesn't exist
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data[0]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

// PUT: Update user's profile
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateProfileRequest = await request.json()
    
    const supabase = await createClient()

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use the RPC function to update profile
    const { data, error } = await supabase
      .rpc('update_profile', {
        user_id: user.id,
        new_email: body.email || null,
        new_full_name: body.full_name || null,
        new_name: body.name || null,
        new_gender: body.gender || null,
        new_birthday: body.birthday || null,
        new_phone_number: body.phone_number || null,
        new_address: body.address || null,
        new_settings: body.settings || null,
        new_profile_image: body.profile_image || null
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      )
    }

    // Check if update was successful
    if (!data) {
      return NextResponse.json(
        { error: 'Update failed - profile not found or access denied' },
        { status: 404 }
      )
    }

    // Get updated profile data
    const { data: updatedProfile, error: fetchError } = await supabase
      .rpc('get_full_profile', {
        user_id: user.id
      })

    if (fetchError) {
      return NextResponse.json(
        { error: 'Profile updated but failed to fetch updated data', details: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile[0]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

// POST: Create initial profile (for new users)
export async function POST(request: NextRequest) {
  try {
    const body: UpdateProfileRequest = await request.json()
    
    if (!body.email || !body.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create profile using direct insert (RPC functions are for updates)
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        uuid: user.id,
        email: body.email,
        full_name: body.full_name,
        name: body.name || {},
        gender: body.gender,
        birthday: body.birthday,
        phone_number: body.phone_number,
        address: body.address || {},
        settings: body.settings || {},
        profile_image: body.profile_image
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}