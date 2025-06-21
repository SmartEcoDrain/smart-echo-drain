import { SensorThresholds, ClogDetectionResult } from "@/types/clog-detection";

export class ClogDetectionEngine {
  private static readonly DEFAULT_THRESHOLDS: SensorThresholds = {
    tof: {
      normal: { min: 50, max: 200 }, // mm - normal water level range
      warning: { min: 30, max: 250 }, // approaching limits
      critical: { min: 0, max: 300 }  // critical levels
    },
    turbidity: {
      normal: 100,    // NTU - clear water
      warning: 250,   // slightly cloudy
      critical: 500   // very cloudy/debris
    },
    weight: {
      baseline: 0,        // kg - empty drain weight
      warningIncrease: 2, // kg - minor debris accumulation
      criticalIncrease: 5 // kg - significant blockage
    },
    force: {
      normalVariance: 0.5,  // N - normal force variation
      warningVariance: 1.5, // N - increased variation
      criticalVariance: 3.0 // N - high variation indicating blockage
    }
  };

  static detectClog(deviceData: any, thresholds: SensorThresholds = this.DEFAULT_THRESHOLDS): ClogDetectionResult {
    const factors = {
      waterLevel: this.analyzeWaterLevel(deviceData.tof, thresholds.tof),
      flowRate: this.analyzeFlowRate(deviceData.force0, deviceData.force1, thresholds.force),
      turbidity: this.analyzeTurbidity(deviceData.turbidity, thresholds.turbidity),
      weight: this.analyzeWeight(deviceData.weight, thresholds.weight)
    };

    const { isClogged, severity, confidence } = this.calculateOverallStatus(factors, deviceData);
    const recommendations = this.generateRecommendations(factors, severity);

    return {
      isClogged,
      severity,
      confidence,
      factors,
      recommendations,
      lastAnalyzed: new Date().toISOString()
    };
  }

  private static analyzeWaterLevel(tof: number, thresholds: any): boolean {
    if (!tof) return false;
    
    // Lower ToF reading means higher water level (sensor measures distance to water surface)
    // High water level with low flow could indicate clogging
    return tof < thresholds.normal.min || tof > thresholds.critical.max;
  }

  private static analyzeFlowRate(force0: number, force1: number, thresholds: any): boolean {
    if (!force0 || !force1) return false;
    
    // Calculate force variance - high variance might indicate turbulent flow due to blockage
    const forceVariance = Math.abs(force0 - force1);
    return forceVariance > thresholds.warningVariance;
  }

  private static analyzeTurbidity(turbidity: number, thresholds: any): boolean {
    if (!turbidity) return false;
    
    // High turbidity indicates debris/sediment in water
    return turbidity > thresholds.warning;
  }

  private static analyzeWeight(weight: number, thresholds: any): boolean {
    if (!weight) return false;
    
    // Increased weight indicates debris accumulation
    return weight > thresholds.baseline + thresholds.warningIncrease;
  }

  private static calculateOverallStatus(factors: any, deviceData: any) {
    const activeFactors = Object.values(factors).filter(Boolean).length;
    const totalFactors = Object.keys(factors).length;
    
    let severity: 'none' | 'minor' | 'moderate' | 'severe' = 'none';
    let confidence = 0;
    
    if (activeFactors === 0) {
      severity = 'none';
      confidence = 85;
    } else if (activeFactors === 1) {
      severity = 'minor';
      confidence = 60;
    } else if (activeFactors === 2) {
      severity = 'moderate';
      confidence = 75;
    } else if (activeFactors >= 3) {
      severity = 'severe';
      confidence = 90;
    }

    // Boost confidence if multiple critical sensors are triggered
    if (factors.waterLevel && factors.weight) confidence += 10;
    if (factors.turbidity && factors.flowRate) confidence += 5;
    
    confidence = Math.min(confidence, 100);
    
    return {
      isClogged: activeFactors > 0,
      severity,
      confidence
    };
  }

  private static generateRecommendations(factors: any, severity: string): string[] {
    const recommendations: string[] = [];
    
    if (factors.waterLevel) {
      recommendations.push("Check water level - possible backup detected");
    }
    
    if (factors.weight) {
      recommendations.push("Heavy debris accumulation detected - manual cleaning recommended");
    }
    
    if (factors.turbidity) {
      recommendations.push("High turbidity detected - check for sediment buildup");
    }
    
    if (factors.flowRate) {
      recommendations.push("Irregular flow patterns detected - inspect for partial blockages");
    }
    
    if (severity === 'severe') {
      recommendations.push("⚠️ URGENT: Multiple indicators suggest severe clogging - immediate maintenance required");
    } else if (severity === 'moderate') {
      recommendations.push("Schedule maintenance within 24-48 hours");
    } else if (severity === 'minor') {
      recommendations.push("Monitor closely - early intervention may prevent full blockage");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("✅ All systems normal - continue regular monitoring");
    }
    
    return recommendations;
  }
}