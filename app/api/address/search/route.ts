import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Search address components by text
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
    let data, error

    switch (type) {
      case 'region':
        ({ data, error } = await supabase
          .from('address_region')
          .select('reg_code, reg_desc')
          .textSearch('reg_desc', query)
          .limit(limit)
          .order('reg_desc'))
        break

      case 'province':
        ({ data, error } = await supabase
          .from('address_province')
          .select('reg_code, prov_code, prov_desc')
          .textSearch('prov_desc', query)
          .limit(limit)
          .order('prov_desc'))
        break

      case 'city':
        ({ data, error } = await supabase
          .from('address_citymun')
          .select('reg_code, prov_code, citymun_code, citymun_desc')
          .textSearch('citymun_desc', query)
          .limit(limit)
          .order('citymun_desc'))
        break

      case 'barangay':
        ({ data, error } = await supabase
          .from('address_brgy')
          .select('reg_code, prov_code, citymun_code, brgy_code, brgy_desc')
          .textSearch('brgy_desc', query)
          .limit(limit)
          .order('brgy_desc'))
        break

      default:
        // Search all types
        const [regions, provinces, cities, barangays] = await Promise.all([
          supabase.from('address_region').select('reg_code, reg_desc').textSearch('reg_desc', query).limit(3),
          supabase.from('address_province').select('reg_code, prov_code, prov_desc').textSearch('prov_desc', query).limit(3),
          supabase.from('address_citymun').select('reg_code, prov_code, citymun_code, citymun_desc').textSearch('citymun_desc', query).limit(3),
          supabase.from('address_brgy').select('reg_code, prov_code, citymun_code, brgy_code, brgy_desc').textSearch('brgy_desc', query).limit(3)
        ])

        return NextResponse.json({
          success: true,
          data: {
            regions: regions.data || [],
            provinces: provinces.data || [],
            cities: cities.data || [],
            barangays: barangays.data || []
          }
        })
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to search address data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      type: type,
      data: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}