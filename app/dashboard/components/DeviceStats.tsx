// components/DeviceStats.tsx - Enhanced with clog detection statistics
import React from 'react';
import { ClogDetectionEngine } from '@/utils/clog-detection';

interface DeviceStatsProps {
  devices: any[]; // Your DeviceData array
}

const DeviceStats: React.FC<DeviceStatsProps> = ({ devices }) => {
  // Calculate basic stats
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.online_status).length;
  
  // A device is deployed if it has entries in the device_data table
  const deployedDevices = devices.filter(device => 
    device.device_data && device.device_data.length > 0
  ).length;
  
  const lowBatteryDevices = devices.filter(d => (d.battery_percentage || 0) < 25).length;

  // Calculate clog detection stats - only for deployed devices
  const deployedDevicesWithData = devices.filter(device => 
    device.device_data && device.device_data.length > 0
  );
  
  const clogAnalysis = deployedDevicesWithData.map(device => {
    // Use the latest device_data entry for clog detection
    const latestData = device.device_data[0]; // Assuming sorted by latest first
    return ClogDetectionEngine.detectClog(latestData);
  });

  const cloggedDevices = clogAnalysis.filter(result => result.isClogged).length;
  const severeCloggedDevices = clogAnalysis.filter(result => result.severity === 'severe').length;
  const moderateCloggedDevices = clogAnalysis.filter(result => result.severity === 'moderate').length;
  const minorCloggedDevices = clogAnalysis.filter(result => result.severity === 'minor').length;

  const stats = [
    {
      label: 'Total Devices',
      value: totalDevices,
      icon: '📱',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Online',
      value: onlineDevices,
      subtext: `${totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}%`,
      icon: '🟢',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'Deployed',
      value: deployedDevices,
      subtext: `${totalDevices > 0 ? Math.round((deployedDevices / totalDevices) * 100) : 0}%`,
      icon: '📊',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Low Battery',
      value: lowBatteryDevices,
      icon: '🔋',
      color: lowBatteryDevices > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: lowBatteryDevices > 0 ? 'bg-red-50' : 'bg-gray-50',
      borderColor: lowBatteryDevices > 0 ? 'border-red-200' : 'border-gray-200'
    }
  ];

  // Add clog detection stats if we have deployed devices
  if (deployedDevices > 0) {
    stats.push({
      label: 'Clogged Drains',
      value: cloggedDevices,
      subtext: `${Math.round((cloggedDevices / deployedDevices) * 100)}%`,
      icon: '🚨',
      color: cloggedDevices > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: cloggedDevices > 0 ? 'bg-red-50' : 'bg-green-50',
      borderColor: cloggedDevices > 0 ? 'border-red-200' : 'border-green-200'
    });

    if (severeCloggedDevices > 0) {
      stats.push({
        label: 'Urgent Attention',
        value: severeCloggedDevices,
        subtext: 'Severe clogs',
        icon: '⚠️',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300'
      });
    }
  }

  return (
    <div className="mb-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-4 transition-all hover:shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">{stat.label}</div>
            {stat.subtext && (
              <div className="text-xs text-gray-500 mt-1">{stat.subtext}</div>
            )}
          </div>
        ))}
      </div>

      {/* Deployment Status Summary */}
      {totalDevices > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-800 mb-1 flex items-center">
                <span className="mr-2">📊</span>
                Deployment Overview
              </h3>
              <p className="text-purple-700 text-sm">
                {deployedDevices} of {totalDevices} devices are actively deployed and sending data
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{deployedDevices}</div>
              <div className="text-sm text-purple-500">Active</div>
            </div>
          </div>
          
          {totalDevices - deployedDevices > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <div className="text-purple-600 text-sm">
                <strong>{totalDevices - deployedDevices}</strong> devices are registered but not yet deployed
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clog Detection Summary */}
      {deployedDevices > 0 && cloggedDevices > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center">
            <span className="mr-2">🚨</span>
            Clog Detection Alert Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {severeCloggedDevices > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                <div className="text-red-800 font-semibold text-lg">{severeCloggedDevices}</div>
                <div className="text-red-700 text-sm">Severe Clogs</div>
                <div className="text-red-600 text-xs mt-1">⚠️ Immediate action required</div>
              </div>
            )}
            
            {moderateCloggedDevices > 0 && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                <div className="text-orange-800 font-semibold text-lg">{moderateCloggedDevices}</div>
                <div className="text-orange-700 text-sm">Moderate Clogs</div>
                <div className="text-orange-600 text-xs mt-1">⏰ Schedule maintenance</div>
              </div>
            )}
            
            {minorCloggedDevices > 0 && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                <div className="text-yellow-800 font-semibold text-lg">{minorCloggedDevices}</div>
                <div className="text-yellow-700 text-sm">Minor Clogs</div>
                <div className="text-yellow-600 text-xs mt-1">👁️ Monitor closely</div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-red-700 text-sm">
              <strong>System Health:</strong> {deployedDevices - cloggedDevices} of {deployedDevices} deployed drains are clear
            </div>
            <div className="text-xs text-red-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* All Clear Status */}
      {deployedDevices > 0 && cloggedDevices === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="font-semibold text-green-800">All Systems Clear</h3>
              <p className="text-green-700 text-sm">All {deployedDevices} deployed drains are functioning normally with no clogs detected.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceStats;