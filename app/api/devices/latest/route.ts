import { createClient } from '../../supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get latest device data for all user's devices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id') // Optional: for admin to view specific user's devices

    const supabase = await createClient()

    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use the RPC function to get latest device data
    const { data: deviceData, error: deviceError } = await supabase
      .rpc('get_latest_device_data', {
        user_id: user_id || null
      })

    if (deviceError) {
      return NextResponse.json(
        { error: 'Failed to fetch device data', details: deviceError.message },
        { status: 500 }
      )
    }

    // Get device names and additional info by joining with devices table
    const deviceIds = deviceData?.map((d: { device_id: any }) => d.device_id) || []
    
    let devicesInfo: any[] = []
    if (deviceIds.length > 0) {
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('uuid, name, location, online_status, is_active, device_version')
        .in('uuid', deviceIds)

      if (!devicesError) {
        devicesInfo = devices || []
      }
    }

    // Combine device data with device info
    const enrichedData = deviceData?.map((data: { device_id: any }) => {
      const deviceInfo = devicesInfo.find(d => d.uuid === data.device_id)
      return {
        ...data,
        device_name: deviceInfo?.name || 'Unknown Device',
        device_location: deviceInfo?.location || {},
        device_online_status: deviceInfo?.online_status || false,
        device_is_active: deviceInfo?.is_active || false,
        device_version: deviceInfo?.device_version || 'Unknown'
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: enrichedData,
      count: enrichedData.length
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}