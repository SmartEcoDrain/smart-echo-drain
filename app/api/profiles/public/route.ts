import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get public profile data (limited fields)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Use the RPC function to get public profile
    const { data, error } = await supabase
      .rpc('get_public_profile', {
        user_id: user_id
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch public profile', details: error.message },
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
      profile: data[0]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}