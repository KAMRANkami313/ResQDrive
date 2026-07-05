import { env } from '@config/env';

export interface CrashSoundPrediction {
  label: string;
  confidence: number;
}

export interface CrashSoundResult {
  is_crash: boolean;
  confidence: number;
  detected_classes: CrashSoundPrediction[];
  processing_time_ms: number;
  audio_duration_s: number;
  sample_rate: number;
  error: string | null;
}

export const crashSoundService = {
  async analyze(uri: string): Promise<CrashSoundResult> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await this.analyzeBlob(blob);
    } catch (err) {
      return this.errorResult(err);
    }
  },

  async analyzeBlob(blob: Blob): Promise<CrashSoundResult> {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.wav');
      const apiResponse = await fetch(`${env.crashSoundServiceUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });
      if (!apiResponse.ok) {
        const text = await apiResponse.text();
        throw new Error(`HTTP ${apiResponse.status}: ${text}`);
      }
      const data = await apiResponse.json();
      return data as CrashSoundResult;
    } catch (err) {
      return this.errorResult(err);
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${env.crashSoundServiceUrl}/health`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  },

  errorResult(err: unknown): CrashSoundResult {
    return {
      is_crash: false,
      confidence: 0,
      detected_classes: [],
      processing_time_ms: 0,
      audio_duration_s: 0,
      sample_rate: 16000,
      error: err instanceof Error ? err.message : String(err),
    };
  },
};