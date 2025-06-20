import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Search address components by text using RPC function
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // region, province, city, barangay
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must be at least 2 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Call the RPC function
    const { data, error } = await supabase.rpc('search_address_components', {
      search_query: query,
      search_type: type,
      search_limit: limit
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to search address data', details: error.message },
        { status: 500 }
      )
    }

    // Check if the RPC function returned an error
    if (data && data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}