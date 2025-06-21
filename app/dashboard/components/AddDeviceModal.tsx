'use client'

import { useState } from 'react'
import { AddressDropdown } from '@/components/AddressDropdown'

interface AddDeviceModalProps {
  onClose: () => void
  onSubmit: (deviceData: any) => Promise<void>
}

interface AddressData {
  region: string
  province: string
  city: string
  barangay: string
  street: string
  country: string
  postal_code: string
  municipality: string
}

interface DeviceForm {
  uuid: string
  name: string
  device_version: string
  location: AddressData
  config: {
    sampling_interval: number
    alert_threshold: number
    maintenance_mode: boolean
    auto_calibration: boolean
  }
}

export default function AddDeviceModal({ onClose, onSubmit }: AddDeviceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<DeviceForm>({
    uuid: '',
    name: '',
    device_version: 'v2.1.0',
    location: {
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: '',
      postal_code: '',
      country: 'PH',
      municipality: ''
    },
    config: {
      sampling_interval: 300,
      alert_threshold: 80,
      maintenance_mode: false,
      auto_calibration: true
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.uuid || !formData.name) {
        throw new Error('Device UUID and name are required')
      }

      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add device')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressChange = (address: AddressData) => {
    setFormData(prev => ({
      ...prev,
      location: address
    }))
  }

  const updateConfig = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add New Device</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-red-600 text-sm font-medium">{error}</div>
              </div>
            </div>
          )}

          {/* Device Information Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Device Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device UUID *
                </label>
                <input
                  type="text"
                  value={formData.uuid}
                  onChange={(e) => setFormData(prev => ({ ...prev, uuid: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 550e8400-e29b-41d4-a716-446655440001"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for the device</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Smart Drain Monitor - Main Street"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Descriptive name for easy identification</p>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Version
                </label>
                <select
                  value={formData.device_version}
                  onChange={(e) => setFormData(prev => ({ ...prev, device_version: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="v2.1.0">v2.1.0 (Latest)</option>
                  <option value="v2.0.5">v2.0.5</option>
                  <option value="v1.9.2">v1.9.2 (Legacy)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hardware/firmware version</p>
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
            </div>

            <div className="space-y-4">
              <AddressDropdown
                value={formData.location}
                onChange={handleAddressChange}
                required={false}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.location.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, street: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="House number, street name, subdivision"
                  />
                  <p className="text-xs text-gray-500 mt-1">Complete street address</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.location.postal_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, postal_code: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="e.g., 4234"
                  />
                  <p className="text-xs text-gray-500 mt-1">ZIP/Postal code</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Device Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampling Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.config.sampling_interval}
                  onChange={(e) => updateConfig('sampling_interval', parseInt(e.target.value) || 300)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  min="60"
                  max="3600"
                />
                <p className="text-xs text-gray-500 mt-1">How often the device takes readings (60-3600 seconds)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  value={formData.config.alert_threshold}
                  onChange={(e) => updateConfig('alert_threshold', parseInt(e.target.value) || 80)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Water level percentage that triggers alerts (0-100%)</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="maintenance_mode"
                    checked={formData.config.maintenance_mode}
                    onChange={(e) => updateConfig('maintenance_mode', e.target.checked)}
                    className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="ml-3">
                    <label htmlFor="maintenance_mode" className="text-sm font-medium text-gray-700">
                      Maintenance Mode
                    </label>
                    <p className="text-xs text-gray-500">Disable alerts during maintenance</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="auto_calibration"
                    checked={formData.config.auto_calibration}
                    onChange={(e) => updateConfig('auto_calibration', e.target.checked)}
                    className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="ml-3">
                    <label htmlFor="auto_calibration" className="text-sm font-medium text-gray-700">
                      Auto Calibration
                    </label>
                    <p className="text-xs text-gray-500">Automatically calibrate sensor readings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Device...
                </div>
              ) : (
                'Add Device'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}