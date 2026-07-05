import {
  IIoTService,
  IoTSource,
  IoTStatus,
  ScenarioInfo,
  SensorReadingCallback,
  StatusCallback,
} from './types';

export class BleIoTService implements IIoTService {
  readonly source: IoTSource = 'ble';

  async connect(): Promise<void> {
    throw new Error('BleIoTService not yet implemented — will use react-native-ble-plx in Phase 7');
  }
  async disconnect(): Promise<void> {}
  subscribeToReadings(_callback: SensorReadingCallback): () => void {
    return () => {};
  }
  subscribeToStatus(_callback: StatusCallback): () => void {
    return () => {};
  }
  getStatus(): IoTStatus {
    return {
      source: 'ble',
      connection: 'disconnected',
      lastReadingAt: null,
      errorMessage: 'Not implemented yet',
    };
  }
  async getAvailableScenarios(): Promise<ScenarioInfo[]> {
    return [];
  }
  async triggerScenario(_scenarioId: string): Promise<boolean> {
    return false;
  }
  async clearScenario(): Promise<void> {}
}