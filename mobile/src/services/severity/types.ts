import { DetectionResult } from '@services/detection';
import { CrashSoundResult } from '@api/ai-services';

export type SeverityLevel = 'minor' | 'moderate' | 'severe';

export interface SeverityInput {
  detection: DetectionResult;
  crashSound: CrashSoundResult | null;
}

export interface SeverityAssessment {
  level: SeverityLevel;
  score: number;
  components: {
    gForceNormalized: number;
    rotationNormalized: number;
    speedDropNormalized: number;
    soundConfidence: number;
  };
  weights: {
    gForce: number;
    rotation: number;
    speedDrop: number;
    sound: number;
  };
  thresholds: {
    minor: number;
    moderate: number;
  };
  reasoning: string[];
  timestamp: number;
}

export interface SeverityConfig {
  gForceMax: number;
  rotationMax: number;
  speedDropMax: number;
  weightGForce: number;
  weightRotation: number;
  weightSpeedDrop: number;
  weightSound: number;
  minorThreshold: number;
  moderateThreshold: number;
  soundBonusWhenCrash: number;
}

export const DEFAULT_SEVERITY_CONFIG: SeverityConfig = {
  gForceMax: 5.0,
  rotationMax: 4.0,
  speedDropMax: 80.0,
  weightGForce: 0.4,
  weightRotation: 0.25,
  weightSpeedDrop: 0.2,
  weightSound: 0.15,
  minorThreshold: 0.4,
  moderateThreshold: 0.7,
  soundBonusWhenCrash: 0.1,
};

export type SeverityCallback = (assessment: SeverityAssessment) => void;