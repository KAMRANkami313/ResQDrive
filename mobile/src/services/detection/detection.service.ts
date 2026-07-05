import { getIoTService } from '@services/iot';
import { SensorReading } from '@services/iot/types';
import {
  AnomalyDetector,
} from './anomaly-detector';
import {
  DEFAULT_DETECTION_CONFIG,
  DetectionConfig,
  DetectionEventCallback,
  DetectionResult,
  SuspectedAccidentCallback,
} from './types';

class DetectionService {
  private detector: AnomalyDetector | null = null;
  private config: DetectionConfig = DEFAULT_DETECTION_CONFIG;
  private isRunning = false;
  private readingUnsub: (() => void) | null = null;
  private detectionCallbacks: Set<DetectionEventCallback> = new Set();
  private suspectedCallbacks: Set<SuspectedAccidentCallback> = new Set();

  start(config?: Partial<DetectionConfig>): void {
    if (this.isRunning) {
      if (config) this.updateConfig(config);
      return;
    }
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.detector = new AnomalyDetector(this.config);
    const iot = getIoTService();
    this.readingUnsub = iot.subscribeToReadings((reading) => this.handleReading(reading));
    this.isRunning = true;
  }

  stop(): void {
    if (this.readingUnsub) {
      this.readingUnsub();
      this.readingUnsub = null;
    }
    this.detector?.reset();
    this.detector = null;
    this.isRunning = false;
  }

  isMonitoring(): boolean {
    return this.isRunning;
  }

  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
    this.detector?.updateConfig(this.config);
  }

  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  onDetection(callback: DetectionEventCallback): () => void {
    this.detectionCallbacks.add(callback);
    return () => this.detectionCallbacks.delete(callback);
  }

  onSuspectedAccident(callback: SuspectedAccidentCallback): () => void {
    this.suspectedCallbacks.add(callback);
    return () => this.suspectedCallbacks.delete(callback);
  }

  private handleReading(reading: SensorReading): void {
    if (!this.detector) return;
    const result = this.detector.process(reading);
    this.detectionCallbacks.forEach((cb) => cb(result));
    if (result.isSuspected) {
      this.suspectedCallbacks.forEach((cb) => cb(result));
    }
  }

  getLastDetectionResult(): DetectionResult | null {
    if (!this.detector) return null;
    const latest = this.detector.getBufferWindow().slice(-1)[0];
    if (!latest) return null;
    return {
      isSuspected: false,
      anomalies: [],
      maxAccelMagnitude: 0,
      maxGyroMagnitude: 0,
      maxSpeedDrop: 0,
      reading: latest,
    };
  }

  getBufferSize(): number {
    return this.detector?.getBufferSize() ?? 0;
  }
}

export const detectionService = new DetectionService();
export { AnomalyDetector } from './anomaly-detector';
export { SensorBuffer, accelMagnitude, gyroMagnitude, speedDropKmh } from './sensor-buffer';
export type {
  AnomalyEvent,
  AnomalyType,
  DetectionConfig,
  DetectionResult,
} from './types';
export { DEFAULT_DETECTION_CONFIG } from './types';