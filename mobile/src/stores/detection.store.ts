import { create } from 'zustand';
import { DetectionConfig, DetectionResult } from '@services/detection';

interface DetectionState {
  isMonitoring: boolean;
  config: DetectionConfig;
  lastResult: DetectionResult | null;
  suspectedCount: number;
  setMonitoring: (active: boolean) => void;
  setConfig: (config: DetectionConfig) => void;
  setLastResult: (result: DetectionResult | null) => void;
  incrementSuspected: () => void;
  reset: () => void;
}

const DEFAULTS = {
  isMonitoring: false,
  config: undefined as unknown as DetectionConfig,
  lastResult: null as DetectionResult | null,
  suspectedCount: 0,
};

export const useDetectionStore = create<DetectionState>((set) => ({
  ...DEFAULTS,
  setMonitoring: (isMonitoring) => set({ isMonitoring }),
  setConfig: (config) => set({ config }),
  setLastResult: (lastResult) => set({ lastResult }),
  incrementSuspected: () => set((s) => ({ suspectedCount: s.suspectedCount + 1 })),
  reset: () => set({ ...DEFAULTS }),
}));