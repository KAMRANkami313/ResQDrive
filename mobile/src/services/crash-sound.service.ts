import { Audio } from 'expo-av';
import { crashSoundService, CrashSoundResult } from '@api/ai-services';

const RECORDING_OPTIONS = {
  isMeteringEnabled: false,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 256000,
  },
};

export type AudioRecordingStatus = 'idle' | 'recording' | 'analyzing' | 'stopped' | 'error';

export interface CrashSoundDetectionEvent {
  result: CrashSoundResult;
  timestamp: number;
  audioUri: string;
}

class CrashSoundDetectionService {
  private recording: Audio.Recording | null = null;
  private status: AudioRecordingStatus = 'idle';
  private isMonitoring = false;
  private monitorLoop: ReturnType<typeof setInterval> | null = null;
  private readonly chunkDurationMs = 2000;
  private readonly analysisIntervalMs = 2000;
  private lastAnalyzedAt = 0;
  private eventCallbacks: Set<(event: CrashSoundDetectionEvent) => void> = new Set();
  private statusCallbacks: Set<(status: AudioRecordingStatus) => void> = new Set();
  private resultCallbacks: Set<(result: CrashSoundResult | null) => void> = new Set();
  private lastResult: CrashSoundResult | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.granted;
    } catch {
      return false;
    }
  }

  async startMonitoring(): Promise<boolean> {
    if (this.isMonitoring) return true;
    const granted = await this.requestPermissions();
    if (!granted) {
      this.setStatus('error');
      return false;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      this.isMonitoring = true;
      this.setStatus('recording');
      this.startMonitorLoop();
      return true;
    } catch (err) {
      console.warn('[crash-sound] start failed:', err);
      this.setStatus('error');
      return false;
    }
  }

  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    if (this.monitorLoop) {
      clearInterval(this.monitorLoop);
      this.monitorLoop = null;
    }
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (err) {
        console.warn('[crash-sound] stop recording error:', err);
      }
      this.recording = null;
    }
    this.setStatus('stopped');
    this.lastResult = null;
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  getStatus(): AudioRecordingStatus {
    return this.status;
  }

  getLastResult(): CrashSoundResult | null {
    return this.lastResult;
  }

  onEvent(callback: (event: CrashSoundDetectionEvent) => void): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  onStatusChange(callback: (status: AudioRecordingStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    callback(this.status);
    return () => this.statusCallbacks.delete(callback);
  }

  onResult(callback: (result: CrashSoundResult | null) => void): () => void {
    this.resultCallbacks.add(callback);
    callback(this.lastResult);
    return () => this.resultCallbacks.delete(callback);
  }

  private startMonitorLoop() {
    const run = async () => {
      if (!this.isMonitoring) return;
      const now = Date.now();
      if (now - this.lastAnalyzedAt < this.analysisIntervalMs) return;
      this.lastAnalyzedAt = now;

      try {
        if (this.recording) {
          try {
            await this.recording.stopAndUnloadAsync();
          } catch {
            // ignore
          }
          this.recording = null;
        }

        this.recording = new Audio.Recording();
        await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);
        await this.recording.startAsync();

        await new Promise((resolve) => setTimeout(resolve, this.chunkDurationMs));

        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        this.recording = null;

        if (!uri) return;

        this.setStatus('analyzing');
        const result = await crashSoundService.analyze(uri);
        this.lastResult = result;
        this.resultCallbacks.forEach((cb) => cb(result));

        if (result.is_crash) {
          const event: CrashSoundDetectionEvent = {
            result,
            timestamp: Date.now(),
            audioUri: uri,
          };
          this.eventCallbacks.forEach((cb) => cb(event));
        }

        this.setStatus(this.isMonitoring ? 'recording' : 'stopped');
      } catch (err) {
        console.warn('[crash-sound] monitor loop error:', err);
        this.setStatus('error');
      }
    };

    this.monitorLoop = setInterval(run, this.analysisIntervalMs);
    run();
  }

  private setStatus(status: AudioRecordingStatus) {
    this.status = status;
    this.statusCallbacks.forEach((cb) => cb(status));
  }
}

export const crashSoundDetectionService = new CrashSoundDetectionService();