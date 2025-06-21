// components/DeviceCard.tsx - Enhanced with clog detection
import React, { useState } from 'react';
import { ClogStatus, useDeviceClogDetection } from '@/components/ClogStatus';

interface DeviceCardProps {
  device: any; // Your DeviceData interface
  onRefresh: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);
  const clogResult = useDeviceClogDetection(device);

  const getBatteryColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalBars = (strength: number) => {
    const normalizedStrength = Math.max(0, Math.min(100, strength + 100)); // Convert dBm to 0-100
    const bars = Math.ceil(normalizedStrength / 25);
    return Array.from({ length: 4 }, (_, i) => i < bars);
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{device.device_name}</h3>
          <div className="flex items-center space-x-2">
            {/* Online Status */}
            <div className={`w-3 h-3 rounded-full ${device.device_online_status ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            {/* Signal Strength */}
            <div className="flex items-center space-x-1">
              {getSignalBars(device.signal_strength || -100).map((filled, i) => (
                <div
                  key={i}
                  className={`w-1 h-3 rounded-sm ${filled ? 'bg-gray-600' : 'bg-gray-300'}`}
                  style={{ height: `${(i + 1) * 3 + 3}px` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          Last seen: {formatLastSeen(device.last_updated_at || device.created_at)}
        </p>
      </div>

      {/* Clog Detection Status - Main Feature */}
      {clogResult && device.has_data && (
        <div className="p-4 border-b border-gray-100">
          <ClogStatus result={clogResult} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Battery */}
          <div className="text-center">
            <div className={`text-lg font-semibold ${getBatteryColor(device.battery_percentage || 0)}`}>
              {device.battery_percentage || 0}%
            </div>
            <div className="text-xs text-gray-500">Battery</div>
          </div>
          
          {/* Temperature */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {device.cpu_temperature ? `${device.cpu_temperature.toFixed(1)}°C` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Temp</div>
          </div>
        </div>

        {/* Sensor Readings - Only show if device has data */}
        {device.has_data && (
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Sensor Readings:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Water Level:</span>
                <span className="font-medium">{device.tof ? `${device.tof.toFixed(1)} mm` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Turbidity:</span>
                <span className="font-medium">{device.turbidity ? `${device.turbidity.toFixed(1)} NTU` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Weight:</span>
                <span className="font-medium">{device.weight ? `${device.weight.toFixed(2)} kg` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ultrasonic:</span>
                <span className="font-medium">{device.ultrasonic ? `${device.ultrasonic.toFixed(1)} cm` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Status */}
        {!device.has_data && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              <span className="text-sm text-yellow-800 font-medium">Not Deployed</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">Device registered but no sensor data received</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Device ID</div>
                <div className="font-mono text-xs text-gray-700 truncate">{device.device_id}</div>
              </div>
              <div>
                <div className="text-gray-500">Version</div>
                <div className="text-gray-700">{device.device_version}</div>
              </div>
              <div>
                <div className="text-gray-500">RAM Usage</div>
                <div className="text-gray-700">{device.ram_usage ? `${device.ram_usage.toFixed(1)}%` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Storage</div>
                <div className="text-gray-700">{device.storage_usage ? `${device.storage_usage.toFixed(1)}%` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Solar Power</div>
                <div className="text-gray-700">{device.solar_wattage ? `${device.solar_wattage.toFixed(1)}W` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Uptime</div>
                <div className="text-gray-700">
                  {device.uptime_ms ? `${Math.floor(device.uptime_ms / 3600000)}h` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Force Sensors (if available) */}
            {device.has_data && (device.force0 !== null || device.force1 !== null) && (
              <div>
                <div className="text-gray-500 text-sm mb-1">Force Sensors</div>
                <div className="flex space-x-4 text-sm">
                  <span>F0: {device.force0 ? `${device.force0.toFixed(2)}N` : 'N/A'}</span>
                  <span>F1: {device.force1 ? `${device.force1.toFixed(2)}N` : 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Device Location */}
            {device.device_location && Object.keys(device.device_location).length > 0 && (
              <div>
                <div className="text-gray-500 text-sm">Location</div>
                <div className="text-gray-700 text-sm">
                  {device.device_location.address || 'Location set'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;