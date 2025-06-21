import { createAdminClient } from '../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ESP32 API Key - should match the one in devices route
const ESP32_API_KEY = process.env.ESP32_API_KEY

interface DeviceDataRequest {
  device_id: string
  
  // Device data fields
  cpu_temperature?: number
  cpu_frequency?: number
  ram_usage?: number
  storage_usage?: number
  signal_strength?: number
  battery_voltage?: number
  battery_percentage?: number
  solar_wattage?: number
  uptime_ms?: number
  battery_status?: string
  is_online?: boolean
  device_other_data?: Record<string, any>
  device_status?: Record<string, any>
  
  // Module data fields
  tof?: number
  force0?: number
  force1?: number
  weight?: number
  turbidity?: number
  ultrasonic?: number
  module_other_data?: Record<string, any>
  module_status?: Record<string, any>
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  return apiKey === ESP32_API_KEY
}

// POST: Insert device data
export async function POST(request: NextRequest) {
  console.log('POST device data request received')
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body: DeviceDataRequest = await request.json()
    
    // Validate required fields
    if (!body.device_id) {
      return NextResponse.json(
        { error: 'Missing required field: device_id' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verify device exists
    const { data: deviceExists, error: deviceError } = await supabase
      .from('devices')
      .select('uuid')
      .eq('uuid', body.device_id)
      .single()

    if (deviceError || !deviceExists) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Insert device data
    const { data, error } = await supabase
      .from('device_data')
      .insert({
        device_id: body.device_id,
        cpu_temperature: body.cpu_temperature,
        cpu_frequency: body.cpu_frequency,
        ram_usage: body.ram_usage,
        storage_usage: body.storage_usage,
        signal_strength: body.signal_strength,
        battery_voltage: body.battery_voltage,
        battery_percentage: body.battery_percentage,
        solar_wattage: body.solar_wattage,
        uptime_ms: body.uptime_ms,
        battery_status: body.battery_status,
        is_online: body.is_online ?? true,
        device_other_data: body.device_other_data || {},
        device_status: body.device_status || {},
        tof: body.tof,
        force0: body.force0,
        force1: body.force1,
        weight: body.weight,
        turbidity: body.turbidity,
        ultrasonic: body.ultrasonic,
        module_other_data: body.module_other_data || {},
        module_status: body.module_status || {},
        last_updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()


    if (error) {
      return NextResponse.json(
        { error: 'Failed to insert device data', details: error.message },
        { status: 500 }
      )
    }

    // Update device online status
    await supabase
      .from('devices')
      .update({ 
        online_status: true,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', body.device_id)

    return NextResponse.json({
      success: true,
      message: 'Device data inserted successfully',
      data: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

// GET: Retrieve device data (for debugging purposes)
export async function GET(request: NextRequest) {
  try {
    console.log('GET device data request received')

    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const device_id = searchParams.get('device_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!device_id) {
      return NextResponse.json(
        { error: 'Missing device_id parameter' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Use the RPC function from your SQL
    const { data, error } = await supabase
      .rpc('get_device_data', {
        device_uuid: device_id,
        limit_count: limit
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve device data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}