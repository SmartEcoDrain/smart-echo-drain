// components/DeviceFilters.tsx - Enhanced with clog detection filters
import React from 'react';

interface FilterState {
  search: string;
  status: 'all' | 'online' | 'offline';
  batteryLevel: 'all' | 'low' | 'medium' | 'high';
  deploymentStatus: 'all' | 'deployed' | 'not_deployed';
  clogStatus: 'all' | 'clear' | 'clogged' | 'severe' | 'moderate' | 'minor'; // New filter
  sortBy: 'name' | 'battery' | 'lastSeen' | 'signal' | 'clogSeverity'; // Added sorting option
  sortOrder: 'asc' | 'desc';
}

interface DeviceFiltersProps {
  filters: FilterState;
  onFiltersChange: (newFilters: Partial<FilterState>) => void;
  totalDevices?: number;
  deployedDevices?: number;
}

const DeviceFilters: React.FC<DeviceFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  totalDevices = 0,
  deployedDevices = 0 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Devices
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by device name..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Online Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="online">🟢 Online</option>
            <option value="offline">🔴 Offline</option>
          </select>
        </div>

        {/* Battery Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Battery Level
          </label>
          <select
            value={filters.batteryLevel}
            onChange={(e) => onFiltersChange({ batteryLevel: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="high">🔋 High (75%+)</option>
            <option value="medium">🔋 Medium (25-75%)</option>
            <option value="low">🪫 Low (&lt;25%)</option>
          </select>
        </div>

        {/* Deployment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deployment
          </label>
          <select
            value={filters.deploymentStatus}
            onChange={(e) => onFiltersChange({ deploymentStatus: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Devices</option>
            <option value="deployed">📊 Deployed ({deployedDevices})</option>
            <option value="not_deployed">📱 Not Deployed</option>
          </select>
        </div>

        {/* Clog Status - New Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Drain Status
          </label>
          <select
            value={filters.clogStatus}
            onChange={(e) => onFiltersChange({ clogStatus: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Conditions</option>
            <option value="clear">✅ Clear</option>
            <option value="clogged">🚨 Any Clog</option>
            <option value="severe">🚨 Severe</option>
            <option value="moderate">⚠️ Moderate</option>
            <option value="minor">⚡ Minor</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Name</option>
              <option value="battery">Battery</option>
              <option value="lastSeen">Last Seen</option>
              <option value="signal">Signal</option>
              <option value="clogSeverity">Clog Severity</option>
            </select>
            <button
              onClick={() => onFiltersChange({ 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFiltersChange({ 
              status: 'all',
              batteryLevel: 'all',
              deploymentStatus: 'all',
              clogStatus: 'all',
              search: ''
            })}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Clear All Filters
          </button>
          
          <button
            onClick={() => onFiltersChange({ clogStatus: 'severe' })}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors"
          >
            🚨 Urgent Issues
          </button>
          
          <button
            onClick={() => onFiltersChange({ clogStatus: 'clogged' })}
            className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full transition-colors"
          >
            ⚠️ All Clogs
          </button>
          
          <button
            onClick={() => onFiltersChange({ batteryLevel: 'low' })}
            className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full transition-colors"
          >
            🪫 Low Battery
          </button>
          
          <button
            onClick={() => onFiltersChange({ status: 'offline' })}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors"
          >
            🔴 Offline Devices
          </button>
          
          <button
            onClick={() => onFiltersChange({ deploymentStatus: 'not_deployed' })}
            className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors"
          >
            📱 Not Deployed
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="mt-3 text-sm text-gray-600">
        {Object.entries(filters).filter(([key, value]) => 
          value !== 'all' && value !== '' && value !== 'name' && value !== 'asc'
        ).length > 0 && (
          <div className="flex items-center space-x-2">
            <span>Active filters:</span>
            <div className="flex flex-wrap gap-1">
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {filters.status === 'online' ? 'Online' : 'Offline'}
                </span>
              )}
              {filters.batteryLevel !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  Battery: {filters.batteryLevel}
                </span>
              )}
              {filters.deploymentStatus !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  {filters.deploymentStatus === 'deployed' ? 'Deployed' : 'Not Deployed'}
                </span>
              )}
              {filters.clogStatus !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                  Drain: {filters.clogStatus}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceFilters;