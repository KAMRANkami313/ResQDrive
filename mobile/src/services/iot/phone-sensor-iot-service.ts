import {
  IIoTService,
  IoTSource,
  IoTStatus,
  ScenarioInfo,
  SensorReadingCallback,
  StatusCallback,
} from './types';

export class PhoneSensorIoTService implements IIoTService {
  readonly source: IoTSource = 'phone';

  async connect(): Promise<void> {
    throw new Error('PhoneSensorIoTService not yet implemented — will use expo-sensors in Batch 2.1');
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
      source: 'phone',
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