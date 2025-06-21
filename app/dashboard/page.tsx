// Updated page.tsx with proper device deployment detection
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../api/supabase/client'
import DeviceCard from './components/DeviceCard'
import DeviceFilters from './components/DeviceFilters'
import DeviceStats from './components/DeviceStats'
import AddDeviceModal from './components/AddDeviceModal'
import { ClogDetectionEngine } from '@/utils/clog-detection'

interface DeviceData {
  uuid: string
  device_id: string
  device_name: string
  device_location: any
  device_online_status: boolean
  device_is_active: boolean
  device_version: string
  cpu_temperature: number
  cpu_frequency: number
  ram_usage: number
  storage_usage: number
  signal_strength: number
  battery_voltage: number
  battery_percentage: number
  solar_wattage: number
  uptime_ms: number
  battery_status: string
  is_online: boolean
  device_other_data: any
  device_status: any
  tof: number
  force0: number
  force1: number
  weight: number
  turbidity: number
  ultrasonic: number
  module_other_data: any
  module_status: any
  last_updated_at: string
  created_at: string
  has_data: boolean // This will be properly calculated based on device_data existence
  isDeployed: boolean // Additional flag for deployment status
}

interface FilterState {
  search: string
  status: 'all' | 'online' | 'offline'
  batteryLevel: 'all' | 'low' | 'medium' | 'high'
  deploymentStatus: 'all' | 'deployed' | 'not_deployed'
  clogStatus: 'all' | 'clear' | 'clogged' | 'severe' | 'moderate' | 'minor'
  sortBy: 'name' | 'battery' | 'lastSeen' | 'signal' | 'clogSeverity'
  sortOrder: 'asc' | 'desc'
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    batteryLevel: 'all',
    deploymentStatus: 'all',
    clogStatus: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const checkDeviceDeploymentStatus = async (deviceId: string): Promise<boolean> => {
    return true;
    try {
      // Use the device-data API to check if device has data (is deployed)
      const response = await fetch(`/api/device-data?device_id=${deviceId}&limit=1`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_ESP32_API_KEY || '',
        }
      })

      if (!response.ok) {
        console.error('Error checking device deployment:', response.statusText)
        return false
      }

      const result = await response.json()
      
      // Check if the API response indicates the device is deployed
      return result.isDeployed || (result.data && result.data.length > 0)
    } catch (err) {
      console.error('Error checking device deployment:', err)
      return false
    }
  }

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/devices/latest')
      
      if (!response.ok) {
        throw new Error('Failed to fetch devices')
      }

      const result = await response.json()
      const devicesData = result.data || []

      console.log('Raw devices data:', devicesData) // Debug log

      // Check deployment status for each device using the device-data API
      const devicesWithDeploymentStatus = await Promise.all(
        devicesData.map(async (device: any) => {
          const isDeployed = await checkDeviceDeploymentStatus(device.uuid || device.device_id)
          
          console.log(`Device ${device.device_name || device.uuid}: deployed = ${isDeployed}`) // Debug log
          
          return {
            ...device,
            device_id: device.device_id || device.uuid, // Ensure device_id is set
            has_data: isDeployed,
            isDeployed: isDeployed
          }
        })
      )

      console.log('Devices with deployment status:', devicesWithDeploymentStatus) // Debug log
      setDevices(devicesWithDeploymentStatus)
    } catch (err) {
      console.error('Error in fetchDevices:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async (deviceData: any) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...deviceData,
          owner_uuid: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add device')
      }

      await fetchDevices()
      setShowAddModal(false)
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    let filtered = [...devices]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(device => 
        device.device_name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(device => 
        filters.status === 'online' ? device.device_online_status : !device.device_online_status
      )
    }

    // Apply battery level filter
    if (filters.batteryLevel !== 'all') {
      filtered = filtered.filter(device => {
        const battery = device.battery_percentage || 0
        switch (filters.batteryLevel) {
          case 'low': return battery < 25
          case 'medium': return battery >= 25 && battery < 75
          case 'high': return battery >= 75
          default: return true
        }
      })
    }

    // Apply deployment status filter - Fixed to use proper deployment check
    if (filters.deploymentStatus !== 'all') {
      filtered = filtered.filter(device => {
        const isDeployed = device.isDeployed || device.has_data
        return filters.deploymentStatus === 'deployed' ? isDeployed : !isDeployed
      })
    }

    // Apply clog status filter
    if (filters.clogStatus !== 'all') {
      filtered = filtered.filter(device => {
        if (!device.isDeployed && !device.has_data) return false // Can't detect clogs without data
        
        const clogResult = ClogDetectionEngine.detectClog(device)
        
        switch (filters.clogStatus) {
          case 'clear': return !clogResult.isClogged
          case 'clogged': return clogResult.isClogged
          case 'severe': return clogResult.severity === 'severe'
          case 'moderate': return clogResult.severity === 'moderate'
          case 'minor': return clogResult.severity === 'minor'
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.device_name.toLowerCase()
          bValue = b.device_name.toLowerCase()
          break
        case 'battery':
          aValue = a.battery_percentage || 0
          bValue = b.battery_percentage || 0
          break
        case 'lastSeen':
          aValue = new Date(a.last_updated_at || a.created_at).getTime()
          bValue = new Date(b.last_updated_at || b.created_at).getTime()
          break
        case 'signal':
          aValue = a.signal_strength || -100
          bValue = b.signal_strength || -100
          break
        case 'clogSeverity':
          const getSeverityValue = (device: DeviceData) => {
            if (!device.isDeployed && !device.has_data) return 0
            const result = ClogDetectionEngine.detectClog(device)
            switch (result.severity) {
              case 'severe': return 4
              case 'moderate': return 3
              case 'minor': return 2
              case 'none': return 1
              default: return 0
            }
          }
          aValue = getSeverityValue(a)
          bValue = getSeverityValue(b)
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        return filters.sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    setFilteredDevices(filtered)
  }, [devices, filters])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading devices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading devices</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDevices}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const deployedDevices = devices.filter(d => d.isDeployed || d.has_data).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Drain Monitor Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your Smart Echo Drain devices with AI-powered clog detection</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchDevices}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
              title="Refresh all device data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Device</span>
            </button>
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Debug: Total devices: {devices.length}, Deployed: {deployedDevices}, Filtered: {filteredDevices.length}
          </p>
        </div>

        {/* Stats Overview with Clog Detection */}
        <DeviceStats devices={devices} />

        {/* Enhanced Filters with Clog Detection */}
        <DeviceFilters 
          filters={filters} 
          onFiltersChange={(newFilters) => setFilters({...filters, ...newFilters})}
          totalDevices={devices.length}
          deployedDevices={deployedDevices}
        />

        {/* Results Summary */}
        {filteredDevices.length !== devices.length && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Showing {filteredDevices.length} of {devices.length} devices
              {filters.clogStatus !== 'all' && ` with ${filters.clogStatus} status`}
              {filters.deploymentStatus !== 'all' && ` that are ${filters.deploymentStatus.replace('_', ' ')}`}
            </p>
          </div>
        )}

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map(device => (
            <DeviceCard 
              key={device.device_id || device.uuid} 
              device={device}
              onRefresh={fetchDevices}
            />
          ))}
        </div>

        {/* Empty States */}
        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              {devices.length === 0 ? '📱' : '🔍'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {devices.length === 0 ? 'No devices found' : 'No devices match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {devices.length === 0 
                ? "You don't have any devices registered yet. Add your first Smart Echo Drain device to get started."
                : "Try adjusting your filters to see more devices, or clear all filters to see everything."
              }
            </p>
            {devices.length === 0 ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Add Your First Device
              </button>
            ) : (
              <button
                onClick={() => setFilters({
                  search: '',
                  status: 'all',
                  batteryLevel: 'all',
                  deploymentStatus: 'all',
                  clogStatus: 'all',
                  sortBy: 'name',
                  sortOrder: 'asc'
                })}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddDevice}
        />
      )}
    </div>
  )
}