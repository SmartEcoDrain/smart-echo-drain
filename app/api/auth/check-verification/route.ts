import { createAdminClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Check email verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Missing required parameter: email' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Get user by email using admin client
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check verification status', details: error.message },
        { status: 400 }
      )
    }

    const user = data.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      verified: user.email_confirmed_at ? true : false,
      email: user.email
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}