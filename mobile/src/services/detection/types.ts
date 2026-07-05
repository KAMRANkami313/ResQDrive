import { SensorReading } from '@services/iot/types';

export type AnomalyType = 'acceleration' | 'rotation' | 'speed_drop';

export interface AnomalyEvent {
  type: AnomalyType;
  value: number;
  threshold: number;
  timestamp: number;
  reading: SensorReading;
}

export interface DetectionResult {
  isSuspected: boolean;
  anomalies: AnomalyEvent[];
  maxAccelMagnitude: number;
  maxGyroMagnitude: number;
  maxSpeedDrop: number;
  reading: SensorReading;
}

export interface DetectionConfig {
  accelThresholdG: number;
  gyroThresholdRadS: number;
  speedDropThresholdKmh: number;
  speedDropWindowMs: number;
  minAnomaliesForSuspected: number;
  cooldownMs: number;
  bufferWindowMs: number;
}

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  accelThresholdG: 2.0,
  gyroThresholdRadS: 1.5,
  speedDropThresholdKmh: 30,
  speedDropWindowMs: 2000,
  minAnomaliesForSuspected: 2,
  cooldownMs: 30000,
  bufferWindowMs: 60000,
};

export type DetectionEventCallback = (result: DetectionResult) => void;
export type SuspectedAccidentCallback = (result: DetectionResult) => void;