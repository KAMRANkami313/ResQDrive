import { create } from 'zustand';
import { IoTConnectionStatus, IoTSource } from '@services/iot';

interface IoTState {
  source: IoTSource;
  connection: IoTConnectionStatus;
  isDrivingModeActive: boolean;
  setSource: (source: IoTSource) => void;
  setConnection: (status: IoTConnectionStatus) => void;
  setDrivingMode: (active: boolean) => void;
}

export const useIoTStore = create<IoTState>((set) => ({
  source: 'simulator',
  connection: 'disconnected',
  isDrivingModeActive: false,
  setSource: (source) => set({ source }),
  setConnection: (connection) => set({ connection }),
  setDrivingMode: (isDrivingModeActive) => set({ isDrivingModeActive }),
}));