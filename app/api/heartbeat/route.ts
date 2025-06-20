import { createClient } from '../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Load ESP32 API Key from environment variables
const ESP32_API_KEY = process.env.ESP32_API_KEY
  
interface HeartbeatRequest {
  device_id: string
  is_online?: boolean
  last_seen?: string
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  return apiKey === ESP32_API_KEY
}

// POST: Device heartbeat - simple endpoint to update device online status
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body: HeartbeatRequest = await request.json()
    
    if (!body.device_id) {
      return NextResponse.json(
        { error: 'Missing required field: device_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update device online status and last seen timestamp
    const { data, error } = await supabase
      .from('devices')
      .update({
        online_status: body.is_online ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', body.device_id)
      .select('uuid, name, online_status')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update device status', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat received',
      device: data,
      server_time: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}