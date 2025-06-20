'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../api/supabase/client'
import DeviceCard from './components/DeviceCard'
import DeviceFilters from './components/DeviceFilters'
import DeviceStats from './components/DeviceStats'


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
}

interface FilterState {
  search: string
  status: 'all' | 'online' | 'offline'
  batteryLevel: 'all' | 'low' | 'medium' | 'high'
  sortBy: 'name' | 'battery' | 'lastSeen' | 'signal'
  sortOrder: 'asc' | 'desc'
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    batteryLevel: 'all',
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

  useEffect(() => {
    fetchDevices()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDevices, 30000)
    return () => clearInterval(interval)
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.device_name
          bValue = b.device_name
          break
        case 'battery':
          aValue = a.battery_percentage || 0
          bValue = b.battery_percentage || 0
          break
        case 'lastSeen':
          aValue = new Date(a.last_updated_at || a.created_at)
          bValue = new Date(b.last_updated_at || b.created_at)
          break
        case 'signal':
          aValue = a.signal_strength || 0
          bValue = b.signal_strength || 0
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your Smart Echo Drain devices</p>
        </div>

        {/* Stats Overview */}
        <DeviceStats devices={devices} />

        {/* Filters */}
        <DeviceFilters filters={filters} onFiltersChange={setFilters} />

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
            <p className="text-gray-600">
              {devices.length === 0 
                ? "You don't have any devices registered yet."
                : "No devices match your current filters."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}