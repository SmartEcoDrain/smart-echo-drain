export interface ClogDetectionResult {
  isClogged: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  confidence: number; // 0-100
  factors: {
    waterLevel: boolean;
    flowRate: boolean;
    turbidity: boolean;
    weight: boolean;
  };
  recommendations: string[];
  lastAnalyzed: string;
}

export interface SensorThresholds {
  tof: {
    normal: { min: number; max: number };
    warning: { min: number; max: number };
    critical: { min: number; max: number };
  };
  turbidity: {
    normal: number;
    warning: number;
    critical: number;
  };
  weight: {
    baseline: number;
    warningIncrease: number;
    criticalIncrease: number;
  };
  force: {
    normalVariance: number;
    warningVariance: number;
    criticalVariance: number;
  };
}