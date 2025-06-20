interface DeviceStatsProps {
  devices: any[]
}

export default function DeviceStats({ devices }: DeviceStatsProps) {
  const totalDevices = devices.length
  const onlineDevices = devices.filter(d => d.device_online_status).length
  const lowBatteryDevices = devices.filter(d => (d.battery_percentage || 0) < 25).length
  const averageBattery = devices.length > 0 
    ? devices.reduce((sum, d) => sum + (d.battery_percentage || 0), 0) / devices.length 
    : 0

  const stats = [
    {
      title: 'Total Devices',
      value: totalDevices,
      icon: '📱',
      color: 'bg-blue-500'
    },
    {
      title: 'Online',
      value: onlineDevices,
      subtitle: `${totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}%`,
      icon: '🟢',
      color: 'bg-green-500'
    },
    {
      title: 'Low Battery',
      value: lowBatteryDevices,
      subtitle: '< 25%',
      icon: '🔋',
      color: lowBatteryDevices > 0 ? 'bg-red-500' : 'bg-gray-500'
    },
    {
      title: 'Avg Battery',
      value: `${Math.round(averageBattery)}%`,
      icon: '⚡',
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3 text-white text-2xl mr-4`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}