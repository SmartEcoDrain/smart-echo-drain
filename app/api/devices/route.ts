import { createAdminClient } from '../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ESP32 API Key - store this in environment variables
const ESP32_API_KEY = process.env.ESP32_API_KEY

interface DeviceRegistrationRequest {
  uuid?: string
  name: string
  owner_uuid: string
  location: {
    region?: string
    province?: string
    city?: string
    barangay?: string
    street?: string
    postal_code?: string
    country?: string
  }
  device_version: string
  config?: Record<string, any>
}

interface DeviceUpdateRequest {
  uuid: string
  name?: string
  location?: any
  online_status?: boolean
  is_active?: boolean
  config?: Record<string, any>
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  return apiKey === ESP32_API_KEY
}

// POST: Register or update device
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body: DeviceRegistrationRequest = await request.json()

    // Validate required fields
    if (!body.uuid || !body.name || !body.device_version || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields: uuid, name, device_version, location' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Check if device already exists (for update)
    if (body.uuid) {
      const { data: existingDevice, error: checkError } = await supabase
        .from('devices')
        .select('uuid')
        .eq('uuid', body.uuid)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Database error', details: checkError.message },
          { status: 500 }
        )
      }
 
      // Update existing device
      if (existingDevice) {
        const { data, error } = await supabase
          .from('devices')
          .update({
            name: body.name,
            location: body.location,
            device_version: body.device_version,
            config: body.config || {},
            online_status: true,
            updated_at: new Date().toISOString()
          })
          .eq('uuid', body.uuid)
          .select()
          .single()

        if (error) {
          return NextResponse.json(
            { error: 'Failed to update device', details: error.message },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Device updated successfully',
          device: data
        })
      }
    }

    // Create new device
    const { data, error } = await supabase
      .from('devices')
      .insert({
        uuid: body.uuid,
        owner_uuid: body.owner_uuid,
        name: body.name,
        location: body.location,
        device_version: body.device_version,
        config: body.config || {},
        online_status: true,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to register device', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
      device: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

// PUT: Update device status/config
export async function PUT(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body: DeviceUpdateRequest = await request.json()

    if (!body.uuid) {
      return NextResponse.json(
        { error: 'Missing required field: device_uuid' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.location !== undefined) updateData.location = body.location
    if (body.online_status !== undefined) updateData.online_status = body.online_status
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.config !== undefined) updateData.config = body.config

    const { data, error } = await supabase
      .from('devices')
      .update(updateData)
      .eq('uuid', body.uuid)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update device', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Device updated successfully',
      device: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

// GET: Retrieve device data
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const uuid = searchParams.get('uuid')
    const owner_uuid = searchParams.get('owner_uuid')
    const name = searchParams.get('name')
    const online_only = searchParams.get('online_only') === 'true'
    const active_only = searchParams.get('active_only') === 'true'

    const supabase = await createAdminClient()

    let query = supabase.from('devices').select('*')

    // Filter by specific device UUID
    if (uuid) {
      query = query.eq('uuid', uuid)

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Device not found' },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { error: 'Database error', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        device: data
      })
    }

    // Filter by owner UUID
    if (owner_uuid) {
      query = query.eq('owner_uuid', owner_uuid)
    }

    // Filter by device name (partial match)
    if (name) {
      query = query.ilike('name', `%${name}%`)
    }

    // Filter by online status
    if (online_only) {
      query = query.eq('online_status', true)
    }

    // Filter by active status
    if (active_only) {
      query = query.eq('is_active', true)
    }

    // Order by updated_at descending
    query = query.order('updated_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      devices: data,
      count: data.length
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}