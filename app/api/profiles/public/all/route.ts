import { createClient } from '../../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get public profiles list (available to everyone)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per request
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    const supabase = await createClient()

    // Use the RPC function to get public profiles
    const { data: profiles, error: profilesError } = await supabase
      .rpc('get_public_profiles', {
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
      .rpc('get_public_profiles_count', {
        search_query: search
      })

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles count', details: countError.message },
        { status: 500 }
      )
    }

    const hasMore = (offset + limit) < totalCount

    return NextResponse.json({
      success: true,
      profiles: profiles || [],
      pagination: {
        total: totalCount || 0,
        limit: limit,
        offset: offset,
        has_more: hasMore,
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((totalCount || 0) / limit)
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