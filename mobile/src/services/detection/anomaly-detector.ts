import { SensorReading } from '@services/iot/types';
import {
  AnomalyEvent,
  DetectionConfig,
  DetectionResult,
} from './types';
import {
  SensorBuffer,
  accelMagnitude,
  gyroMagnitude,
  speedDropKmh,
} from './sensor-buffer';

export class AnomalyDetector {
  private buffer: SensorBuffer;
  private config: DetectionConfig;
  private lastSuspectedAt: number = 0;

  constructor(config: DetectionConfig) {
    this.config = config;
    this.buffer = new SensorBuffer(config.bufferWindowMs);
  }

  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.bufferWindowMs) {
      this.buffer = new SensorBuffer(config.bufferWindowMs);
    }
  }

  process(reading: SensorReading): DetectionResult {
    this.buffer.push(reading);

    const anomalies: AnomalyEvent[] = [];

    const accelMag = accelMagnitude(reading);
    if (accelMag >= this.config.accelThresholdG) {
      anomalies.push({
        type: 'acceleration',
        value: accelMag,
        threshold: this.config.accelThresholdG,
        timestamp: Date.now(),
        reading,
      });
    }

    const gyroMag = gyroMagnitude(reading);
    if (gyroMag >= this.config.gyroThresholdRadS) {
      anomalies.push({
        type: 'rotation',
        value: gyroMag,
        threshold: this.config.gyroThresholdRadS,
        timestamp: Date.now(),
        reading,
      });
    }

    const speedDrop = this.detectSpeedDrop(reading);
    if (speedDrop >= this.config.speedDropThresholdKmh) {
      anomalies.push({
        type: 'speed_drop',
        value: speedDrop,
        threshold: this.config.speedDropThresholdKmh,
        timestamp: Date.now(),
        reading,
      });
    }

    const maxAccel = this.bufferMax(accelMagnitude);
    const maxGyro = this.bufferMax(gyroMagnitude);
    const maxSpeedDrop = this.bufferMaxSpeedDrop();

    const inCooldown = Date.now() - this.lastSuspectedAt < this.config.cooldownMs;
    const isSuspected =
      anomalies.length >= this.config.minAnomaliesForSuspected && !inCooldown;

    if (isSuspected) {
      this.lastSuspectedAt = Date.now();
    }

    return {
      isSuspected,
      anomalies,
      maxAccelMagnitude: maxAccel,
      maxGyroMagnitude: maxGyro,
      maxSpeedDrop: maxSpeedDrop,
      reading,
    };
  }

  private detectSpeedDrop(current: SensorReading): number {
    const windowReadings = this.buffer.getWindow(this.config.speedDropWindowMs);
    if (windowReadings.length < 2) return 0;
    const earliest = windowReadings[0];
    return speedDropKmh(current, earliest);
  }

  private bufferMax(
    extractor: (r: SensorReading) => number,
  ): number {
    let max = 0;
    for (const r of this.buffer.getAll()) {
      const v = extractor(r);
      if (v > max) max = v;
    }
    return max;
  }

  private bufferMaxSpeedDrop(): number {
    const readings = this.buffer.getAll();
    if (readings.length < 2) return 0;
    let maxDrop = 0;
    const earliest = readings[0];
    for (let i = 1; i < readings.length; i++) {
      const drop = speedDropKmh(readings[i], earliest);
      if (drop > maxDrop) maxDrop = drop;
    }
    return maxDrop;
  }

  reset(): void {
    this.buffer.clear();
    this.lastSuspectedAt = 0;
  }

  getBufferSize(): number {
    return this.buffer.size();
  }

  getBufferWindow(): SensorReading[] {
    return this.buffer.getAll();
  }
}