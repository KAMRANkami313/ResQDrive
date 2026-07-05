import { useEffect, useState, useRef } from 'react';
import { detectionService } from '@services/detection';
import { DetectionConfig, DetectionResult } from '@services/detection';

const UI_UPDATE_THROTTLE_MS = 500;

export function useDetectionMonitoring(autoStart: boolean = false) {
  const [isMonitoring, setIsMonitoring] = useState(detectionService.isMonitoring());
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const [suspectedCount, setSuspectedCount] = useState(0);
  const lastUiUpdateRef = useRef(0);

  useEffect(() => {
    const unsub1 = detectionService.onDetection((r) => {
      const now = Date.now();
      if (now - lastUiUpdateRef.current >= UI_UPDATE_THROTTLE_MS) {
        lastUiUpdateRef.current = now;
        setLastResult(r);
      }
    });
    const unsub2 = detectionService.onSuspectedAccident((r) => {
      lastUiUpdateRef.current = Date.now();
      setLastResult(r);
      setSuspectedCount((c) => c + 1);
    });
    if (autoStart) {
      detectionService.start();
      setIsMonitoring(true);
    }
    return () => {
      unsub1();
      unsub2();
    };
  }, [autoStart]);

  const start = () => {
    detectionService.start();
    setIsMonitoring(true);
  };

  const stop = () => {
    detectionService.stop();
    setIsMonitoring(false);
    setLastResult(null);
  };

  const updateConfig = (config: Partial<DetectionConfig>) => {
    detectionService.updateConfig(config);
  };

  return {
    isMonitoring,
    lastResult,
    suspectedCount,
    start,
    stop,
    updateConfig,
    resetSuspectedCount: () => setSuspectedCount(0),
  };
}

export function useDetectionResult() {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const lastUiUpdateRef = useRef(0);

  useEffect(() => {
    const unsub = detectionService.onDetection((r) => {
      const now = Date.now();
      if (now - lastUiUpdateRef.current >= UI_UPDATE_THROTTLE_MS) {
        lastUiUpdateRef.current = now;
        setResult(r);
      }
    });
    return unsub;
  }, []);

  return result;
}