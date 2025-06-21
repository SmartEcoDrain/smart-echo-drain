'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../api/supabase/client'
import DeviceCard from './components/DeviceCard'
import DeviceFilters from './components/DeviceFilters'
import DeviceStats from './components/DeviceStats'
import AddDeviceModal from './components/AddDeviceModal'

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
  has_data: boolean  // New field to track deployment status
}

interface FilterState {
  search: string
  status: 'all' | 'online' | 'offline'
  batteryLevel: 'all' | 'low' | 'medium' | 'high'
  deploymentStatus: 'all' | 'deployed' | 'not_deployed'  // New filter
  sortBy: 'name' | 'battery' | 'lastSeen' | 'signal'
  sortOrder: 'asc' | 'desc'
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)  // New state for modal
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    batteryLevel: 'all',
    deploymentStatus: 'all',  // New filter
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/devices/latest')
      
      if (!response.ok) {
        throw new Error('Failed to fetch devices')
      }

      const result = await response.json()
      setDevices(result.data || [])
    } catch (err) {
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

      // Refresh devices list
      await fetchDevices()
      setShowAddModal(false)
    } catch (err) {
      throw err // Let the modal handle the error
    }
  }

  useEffect(() => {
    fetchDevices()
    
    // Auto refresh disabled - remove the interval
    // const interval = setInterval(fetchDevices, 30000)
    // return () => clearInterval(interval)
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

    // Apply deployment status filter
    if (filters.deploymentStatus !== 'all') {
      filtered = filtered.filter(device => {
        const isDeployed = device.has_data
        return filters.deploymentStatus === 'deployed' ? isDeployed : !isDeployed
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your Smart Echo Drain devices</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Device</span>
          </button>
        </div>

        {/* Stats Overview */}
        <DeviceStats devices={devices} />

        {/* Filters */}
        <DeviceFilters filters={filters} onFiltersChange={(newFilters) => setFilters({...filters, ...newFilters})} />

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map(device => (
            <DeviceCard 
              key={device.device_id} 
              device={device}
              onRefresh={fetchDevices}
            />
          ))}
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-gray-600 mb-6">
              {devices.length === 0 
                ? "You don't have any devices registered yet."
                : "No devices match your current filters."
              }
            </p>
            {devices.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Add Your First Device
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