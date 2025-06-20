import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get all profiles (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    const supabase = await createClient()

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use the RPC function to get all profiles (admin only)
    const { data: profiles, error: profilesError } = await supabase
      .rpc('get_all_profiles', {
        limit_count: limit,
        offset_count: offset,
        search_query: search
      })

    if (profilesError) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { data: totalCount, error: countError } = await supabase
      .rpc('get_profiles_count', {
        search_query: search
      })

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles count', details: countError.message },
        { status: 500 }
      )
    }

    // If no data returned, user is not admin
    if (!profiles || profiles.length === 0) {
      // Check if it's because no profiles exist or user is not admin
      if (totalCount === 0 && !search) {
        return NextResponse.json({
          success: true,
          profiles: [],
          pagination: {
            total: 0,
            limit: limit,
            offset: offset,
            has_more: false
          }
        })
      } else {
        return NextResponse.json(
          { error: 'Access denied - admin privileges required' },
          { status: 403 }
        )
      }
    }

    const hasMore = (offset + limit) < totalCount

    return NextResponse.json({
      success: true,
      profiles: profiles,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        has_more: hasMore,
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil(totalCount / limit)
      },
      search_query: search || null
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}