import { SensorReading } from '@services/iot/types';

export class SensorBuffer {
  private readings: Array<{ timestamp: number; reading: SensorReading }> = [];
  private readonly windowMs: number;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }

  push(reading: SensorReading): void {
    const timestamp = Date.now();
    this.readings.push({ timestamp, reading });
    this.evict();
  }

  private evict(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.readings.length > 0 && this.readings[0].timestamp < cutoff) {
      this.readings.shift();
    }
  }

  getWindow(durationMs: number): SensorReading[] {
    const cutoff = Date.now() - durationMs;
    return this.readings
      .filter((entry) => entry.timestamp >= cutoff)
      .map((entry) => entry.reading);
  }

  getAll(): SensorReading[] {
    return this.readings.map((entry) => entry.reading);
  }

  getLatest(): SensorReading | null {
    if (this.readings.length === 0) return null;
    return this.readings[this.readings.length - 1].reading;
  }

  clear(): void {
    this.readings = [];
  }

  size(): number {
    return this.readings.length;
  }
}

function magnitude3d(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

export function accelMagnitude(reading: SensorReading): number {
  const a = reading.accelerometer_g;
  return magnitude3d(a.x, a.y, a.z);
}

export function gyroMagnitude(reading: SensorReading): number {
  const g = reading.gyroscope_rads;
  return magnitude3d(g.x, g.y, g.z);
}

export function speedDropKmh(
  current: SensorReading,
  previous: SensorReading,
): number {
  return Math.max(0, previous.gps.speed_kmh - current.gps.speed_kmh);
}