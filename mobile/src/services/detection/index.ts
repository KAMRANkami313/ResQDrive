export { detectionService, AnomalyDetector } from './detection.service';
export { SensorBuffer, accelMagnitude, gyroMagnitude, speedDropKmh } from './sensor-buffer';
export { DEFAULT_DETECTION_CONFIG } from './types';
export type {
  AnomalyEvent,
  AnomalyType,
  DetectionConfig,
  DetectionResult,
  DetectionEventCallback,
  SuspectedAccidentCallback,
} from './types';