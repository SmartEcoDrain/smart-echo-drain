'use client'

import { useState } from 'react'

interface DeviceCardProps {
  device: any
  onRefresh: () => void
}

export default function DeviceCard({ device, onRefresh }: DeviceCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getBatteryColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 bg-green-100'
    if (percentage >= 25) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getSignalStrength = (strength: number) => {
    if (strength >= -50) return { bars: 4, color: 'text-green-600' }
    if (strength >= -70) return { bars: 3, color: 'text-yellow-600' }
    if (strength >= -85) return { bars: 2, color: 'text-orange-600' }
    return { bars: 1, color: 'text-red-600' }
  }

  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const signal = getSignalStrength(device.signal_strength || -100)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${device.device_online_status ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h3 className="font-semibold text-gray-900 truncate">{device.device_name}</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className={`w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Version {device.device_version} • Last seen {new Date(device.last_updated_at || device.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Battery */}
          <div className="text-center">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBatteryColor(device.battery_percentage || 0)}`}>
              🔋 {device.battery_percentage || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Battery</p>
          </div>

          {/* Signal */}
          <div className="text-center">
            <div className={`inline-flex items-center space-x-1 ${signal.color}`}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-current rounded-full ${i < signal.bars ? 'opacity-100' : 'opacity-30'}`}
                  style={{ height: `${(i + 1) * 3}px` }}
                ></div>
              ))}
              <span className="text-xs font-medium ml-1">{device.signal_strength || 0} dBm</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Signal</p>
          </div>
        </div>

        {/* Sensor Readings */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-medium text-blue-900">{device.weight?.toFixed(1) || 'N/A'} kg</div>
            <div className="text-blue-600 text-xs">Weight</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-medium text-green-900">{device.tof?.toFixed(1) || 'N/A'} cm</div>
            <div className="text-green-600 text-xs">Distance</div>
          </div>
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">System Status</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">CPU Temp:</span>
                  <span>{device.cpu_temperature?.toFixed(1) || 'N/A'}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RAM Usage:</span>
                  <span>{device.ram_usage?.toFixed(1) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span>{device.storage_usage?.toFixed(1) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span>{device.uptime_ms ? formatUptime(device.uptime_ms) : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sensor Data</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Turbidity:</span>
                  <span>{device.turbidity?.toFixed(2) || 'N/A'} NTU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ultrasonic:</span>
                  <span>{device.ultrasonic?.toFixed(1) || 'N/A'} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Force 0:</span>
                  <span>{device.force0?.toFixed(2) || 'N/A'} N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Force 1:</span>
                  <span>{device.force1?.toFixed(2) || 'N/A'} N</span>
                </div>
              </div>
            </div>
          </div>

          {device.solar_wattage && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-yellow-800 font-medium">☀️ Solar Power</span>
                <span className="text-yellow-900 font-bold">{device.solar_wattage.toFixed(2)}W</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}