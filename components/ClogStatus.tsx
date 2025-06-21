
import React from 'react';
import { ClogDetectionResult } from '../types/clog-detection';
import { ClogDetectionEngine } from '@/utils/clog-detection';

interface ClogStatusProps {
  result: ClogDetectionResult;
  className?: string;
}

export const ClogStatus: React.FC<ClogStatusProps> = ({ result, className = '' }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return '🚨';
      case 'moderate': return '⚠️';
      case 'minor': return '⚡';
      default: return '✅';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity)}`}>
        <span className="mr-2">{getSeverityIcon(result.severity)}</span>
        {result.isClogged ? `${result.severity.toUpperCase()} CLOG` : 'CLEAR'}
        <span className="ml-2 text-xs opacity-75">({result.confidence}%)</span>
      </div>
      
      <div className="mt-3 space-y-2">
        <h4 className="font-medium text-gray-900">Sensor Analysis:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className={`flex items-center ${result.factors.waterLevel ? 'text-red-600' : 'text-green-600'}`}>
            <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: result.factors.waterLevel ? '#dc2626' : '#16a34a'}}></span>
            Water Level
          </div>
          <div className={`flex items-center ${result.factors.flowRate ? 'text-red-600' : 'text-green-600'}`}>
            <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: result.factors.flowRate ? '#dc2626' : '#16a34a'}}></span>
            Flow Rate
          </div>
          <div className={`flex items-center ${result.factors.turbidity ? 'text-red-600' : 'text-green-600'}`}>
            <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: result.factors.turbidity ? '#dc2626' : '#16a34a'}}></span>
            Water Clarity
          </div>
          <div className={`flex items-center ${result.factors.weight ? 'text-red-600' : 'text-green-600'}`}>
            <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: result.factors.weight ? '#dc2626' : '#16a34a'}}></span>
            Debris Load
          </div>
        </div>
      </div>
      
      {result.recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Last analyzed: {new Date(result.lastAnalyzed).toLocaleString()}
      </div>
    </div>
  );
};

// Hook for device clog detection
export const useDeviceClogDetection = (deviceData: any) => {
  const [clogResult, setClogResult] = React.useState<ClogDetectionResult | null>(null);
  
  React.useEffect(() => {
    if (deviceData && deviceData.has_data) {
      const result = ClogDetectionEngine.detectClog(deviceData);
      setClogResult(result);
    }
  }, [deviceData]);
  
  return clogResult;
};