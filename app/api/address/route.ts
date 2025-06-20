import { createClient } from '../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get address dropdown data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reg_code = searchParams.get('reg_code')
    const prov_code = searchParams.get('prov_code')
    const citymun_code = searchParams.get('citymun_code')
    const complete_address = searchParams.get('complete_address')

    const supabase = await createClient()

    // If complete_address is requested with citymun_code
    if (complete_address === 'true' && citymun_code) {
      const { data, error } = await supabase
        .rpc('get_complete_address_data', {
          citymun_code: citymun_code
        })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch complete address data', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    }

    // Use the dropdown RPC function
    const { data, error } = await supabase
      .rpc('get_address_dropdown_data', {
        target_reg_code: reg_code,
        target_prov_code: prov_code,
        target_citymun_code: citymun_code
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch address data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}