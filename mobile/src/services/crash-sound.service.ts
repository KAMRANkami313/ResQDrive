import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { crashSoundService, CrashSoundResult } from '@api/ai-services';

export type AudioRecordingStatus = 'idle' | 'recording' | 'analyzing' | 'stopped' | 'error';

export interface CrashSoundDetectionEvent {
  result: CrashSoundResult;
  timestamp: number;
  audioUri: string;
}

const NATIVE_RECORDING_OPTIONS = {
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
} as const;

const SAMPLE_RATE = 16000;
const CHUNK_DURATION_MS = 2000;
const ANALYSIS_INTERVAL_MS = 2000;

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

class WebAudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private isRecording = false;

  async start(): Promise<void> {
    this.chunks = [];
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx({ sampleRate: SAMPLE_RATE });
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.isRecording) return;
      const input = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(input));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stopAndEncode(): Blob | null {
    this.isRecording = false;
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.mediaStream?.getTracks().forEach((t) => t.stop());
      this.audioContext?.close();
    } catch {
      // ignore
    }

    if (this.chunks.length === 0) return null;
    const totalLength = this.chunks.reduce((acc, c) => acc + c.length, 0);
    const samples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    this.chunks = [];
    return encodeWav(samples, SAMPLE_RATE);
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

class CrashSoundDetectionService {
  private recording: Audio.Recording | null = null;
  private webRecorder: WebAudioRecorder | null = null;
  private status: AudioRecordingStatus = 'idle';
  private isMonitoring = false;
  private monitorLoop: ReturnType<typeof setInterval> | null = null;
  private lastAnalyzedAt = 0;
  private eventCallbacks: Set<(event: CrashSoundDetectionEvent) => void> = new Set();
  private statusCallbacks: Set<(status: AudioRecordingStatus) => void> = new Set();
  private resultCallbacks: Set<(result: CrashSoundResult | null) => void> = new Set();
  private lastResult: CrashSoundResult | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      } catch {
        return false;
      }
    }
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
      if (Platform.OS === 'web') {
        this.webRecorder = new WebAudioRecorder();
        await this.webRecorder.start();
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      }
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
      } catch {
        // ignore
      }
      this.recording = null;
    }
    if (this.webRecorder) {
      this.webRecorder.stopAndEncode();
      this.webRecorder = null;
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
      if (now - this.lastAnalyzedAt < ANALYSIS_INTERVAL_MS) return;
      this.lastAnalyzedAt = now;

      try {
        let audioUri: string | null = null;

        if (Platform.OS === 'web') {
          if (!this.webRecorder || !this.webRecorder.isCurrentlyRecording()) {
            this.webRecorder = new WebAudioRecorder();
            await this.webRecorder.start();
          }
          await new Promise((resolve) => setTimeout(resolve, CHUNK_DURATION_MS));
          const blob = this.webRecorder.stopAndEncode();
          this.webRecorder = null;

          if (blob) {
            this.setStatus('analyzing');
            const result = await this.analyzeBlob(blob);
            audioUri = '';
            this.handleResult(result, audioUri);
            if (this.isMonitoring) {
              this.webRecorder = new WebAudioRecorder();
              await this.webRecorder.start();
            }
          }
        } else {
          if (this.recording) {
            try {
              await this.recording.stopAndUnloadAsync();
            } catch {
              // ignore
            }
            this.recording = null;
          }

          this.recording = new Audio.Recording();
          await this.recording.prepareToRecordAsync(NATIVE_RECORDING_OPTIONS);
          await this.recording.startAsync();

          await new Promise((resolve) => setTimeout(resolve, CHUNK_DURATION_MS));

          await this.recording.stopAndUnloadAsync();
          audioUri = this.recording.getURI();
          this.recording = null;

          if (!audioUri) return;

          this.setStatus('analyzing');
          const result = await crashSoundService.analyze(audioUri);
          this.handleResult(result, audioUri);
        }

        this.setStatus(this.isMonitoring ? 'recording' : 'stopped');
      } catch (err) {
        console.warn('[crash-sound] monitor loop error:', err);
        this.setStatus('error');
      }
    };

    this.monitorLoop = setInterval(run, ANALYSIS_INTERVAL_MS);
    run();
  }

  private async analyzeBlob(blob: Blob): Promise<CrashSoundResult> {
    const url = URL.createObjectURL(blob);
    try {
      const result = await crashSoundService.analyzeBlob(blob);
      return result;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private handleResult(result: CrashSoundResult, audioUri: string) {
    this.lastResult = result;
    this.resultCallbacks.forEach((cb) => cb(result));

    if (result.is_crash) {
      const event: CrashSoundDetectionEvent = {
        result,
        timestamp: Date.now(),
        audioUri,
      };
      this.eventCallbacks.forEach((cb) => cb(event));
    }
  }

  private setStatus(status: AudioRecordingStatus) {
    this.status = status;
    this.statusCallbacks.forEach((cb) => cb(status));
  }
}

export const crashSoundDetectionService = new CrashSoundDetectionService();