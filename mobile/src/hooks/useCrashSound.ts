import { useEffect, useState } from 'react';
import { crashSoundDetectionService, AudioRecordingStatus} from '@services/crash-sound.service';
import { CrashSoundResult } from '@api/ai-services';

export function useCrashSoundMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(crashSoundDetectionService.isCurrentlyMonitoring());
  const [status, setStatus] = useState<AudioRecordingStatus>(crashSoundDetectionService.getStatus());
  const [lastResult, setLastResult] = useState<CrashSoundResult | null>(crashSoundDetectionService.getLastResult());
  const [crashCount, setCrashCount] = useState(0);

  useEffect(() => {
    const unsubStatus = crashSoundDetectionService.onStatusChange((s) => {
      setStatus(s);
      setIsMonitoring(s === 'recording' || s === 'analyzing');
    });
    const unsubResult = crashSoundDetectionService.onResult(setLastResult);
    const unsubEvent = crashSoundDetectionService.onEvent(() => {
      setCrashCount((c) => c + 1);
    });
    return () => {
      unsubStatus();
      unsubResult();
      unsubEvent();
    };
  }, []);

  const start = async () => {
    const ok = await crashSoundDetectionService.startMonitoring();
    setIsMonitoring(ok);
  };

  const stop = async () => {
    await crashSoundDetectionService.stopMonitoring();
    setIsMonitoring(false);
  };

  const resetCrashCount = () => setCrashCount(0);

  return {
    isMonitoring,
    status,
    lastResult,
    crashCount,
    start,
    stop,
    resetCrashCount,
  };
}

export function useCrashSoundHealthCheck() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    const { crashSoundService } = await import('@api/ai-services');
    const ok = await crashSoundService.healthCheck();
    setIsHealthy(ok);
    setChecking(false);
  };

  useEffect(() => {
    check();
  }, []);

  return { isHealthy, checking, check };
}