import { SeverityAssessment, SeverityConfig, SeverityInput, SeverityLevel, DEFAULT_SEVERITY_CONFIG, SeverityCallback } from './types';

class SeverityService {
  private config: SeverityConfig = DEFAULT_SEVERITY_CONFIG;
  private callbacks: Set<SeverityCallback> = new Set();
  private lastAssessment: SeverityAssessment | null = null;

  updateConfig(config: Partial<SeverityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SeverityConfig {
    return { ...this.config };
  }

  assess(input: SeverityInput): SeverityAssessment {
    const { detection, crashSound } = input;

    const gForceNorm = this.normalize(detection.maxAccelMagnitude, this.config.gForceMax);
    const rotationNorm = this.normalize(detection.maxGyroMagnitude, this.config.rotationMax);
    const speedDropNorm = this.normalize(detection.maxSpeedDrop, this.config.speedDropMax);

    let soundConfidence = 0;
    if (crashSound && crashSound.is_crash) {
      soundConfidence = crashSound.confidence;
    } else if (crashSound) {
      soundConfidence = crashSound.confidence * 0.5;
    }

    const score =
      gForceNorm * this.config.weightGForce +
      rotationNorm * this.config.weightRotation +
      speedDropNorm * this.config.weightSpeedDrop +
      soundConfidence * this.config.weightSound;

    let finalScore = score;
    if (crashSound?.is_crash) {
      finalScore = Math.min(1, score + this.config.soundBonusWhenCrash);
    }

    const level = this.scoreToLevel(finalScore);
    const reasoning = this.buildReasoning(detection, crashSound, gForceNorm, rotationNorm, speedDropNorm, level);

    const assessment: SeverityAssessment = {
      level,
      score: Math.round(finalScore * 1000) / 1000,
      components: {
        gForceNormalized: Math.round(gForceNorm * 1000) / 1000,
        rotationNormalized: Math.round(rotationNorm * 1000) / 1000,
        speedDropNormalized: Math.round(speedDropNorm * 1000) / 1000,
        soundConfidence: Math.round(soundConfidence * 1000) / 1000,
      },
      weights: {
        gForce: this.config.weightGForce,
        rotation: this.config.weightRotation,
        speedDrop: this.config.weightSpeedDrop,
        sound: this.config.weightSound,
      },
      thresholds: {
        minor: this.config.minorThreshold,
        moderate: this.config.moderateThreshold,
      },
      reasoning,
      timestamp: Date.now(),
    };

    this.lastAssessment = assessment;
    this.callbacks.forEach((cb) => cb(assessment));
    return assessment;
  }

  getLastAssessment(): SeverityAssessment | null {
    return this.lastAssessment;
  }

  onAssessment(callback: SeverityCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  reset(): void {
    this.lastAssessment = null;
  }

  private normalize(value: number, max: number): number {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, value / max));
  }

  private scoreToLevel(score: number): SeverityLevel {
    if (score < this.config.minorThreshold) return 'minor';
    if (score < this.config.moderateThreshold) return 'moderate';
    return 'severe';
  }

  private buildReasoning(
    detection: SeverityInput['detection'],
    crashSound: SeverityInput['crashSound'],
    gForceNorm: number,
    rotationNorm: number,
    speedDropNorm: number,
    level: SeverityLevel,
  ): string[] {
    const reasons: string[] = [];

    if (detection.maxAccelMagnitude > 0) {
      reasons.push(
        `Peak acceleration ${detection.maxAccelMagnitude.toFixed(2)}g (normalized: ${(gForceNorm * 100).toFixed(0)}%)`,
      );
    }
    if (detection.maxGyroMagnitude > 0) {
      reasons.push(
        `Peak rotation ${detection.maxGyroMagnitude.toFixed(2)} rad/s (normalized: ${(rotationNorm * 100).toFixed(0)}%)`,
      );
    }
    if (detection.maxSpeedDrop > 0) {
      reasons.push(
        `Speed drop ${detection.maxSpeedDrop.toFixed(1)} km/h (normalized: ${(speedDropNorm * 100).toFixed(0)}%)`,
      );
    }
    if (crashSound) {
      if (crashSound.is_crash) {
        reasons.push(
          `Crash sound detected with ${(crashSound.confidence * 100).toFixed(0)}% confidence`,
        );
      } else if (crashSound.confidence > 0) {
        reasons.push(
          `Some crash-like audio (${(crashSound.confidence * 100).toFixed(0)}% confidence) — below threshold`,
        );
      }
    }

    reasons.push(
      level === 'minor'
        ? 'Overall impact metrics indicate a minor incident'
        : level === 'moderate'
        ? 'Multiple moderate-impact indicators detected'
        : 'Severe impact metrics — likely serious accident',
    );

    return reasons;
  }
}

export const severityService = new SeverityService();
export { DEFAULT_SEVERITY_CONFIG } from './types';
export type { SeverityAssessment, SeverityConfig, SeverityInput, SeverityLevel, SeverityCallback } from './types';