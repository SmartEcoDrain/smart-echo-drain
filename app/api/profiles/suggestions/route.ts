import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get user suggestions for autocomplete/mentions (available to everyone)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20) // Max 20 suggestions

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must be at least 2 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Use the RPC function to get user suggestions
    const { data: suggestions, error } = await supabase
      .rpc('get_user_suggestions', {
        search_query: query,
        limit_count: limit
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch user suggestions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      query: query,
      suggestions: suggestions || []
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}