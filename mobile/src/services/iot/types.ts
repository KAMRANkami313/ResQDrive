export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

export interface GyroscopeData {
  x: number;
  y: number;
  z: number;
}

export interface GpsData {
  lat: number;
  lng: number;
  speed_kmh: number;
  accuracy: number;
  heading: number;
}

export interface SensorReading {
  timestamp: string;
  source: 'simulator' | 'phone' | 'ble';
  scenario: string;
  elapsed_in_scenario: number;
  accelerometer_g: AccelerometerData;
  gyroscope_rads: GyroscopeData;
  gps: GpsData;
}

export type IoTConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export type IoTSource = 'simulator' | 'phone' | 'ble';

export interface IoTStatus {
  source: IoTSource;
  connection: IoTConnectionStatus;
  lastReadingAt: number | null;
  errorMessage: string | null;
}

export type SensorReadingCallback = (reading: SensorReading) => void;
export type StatusCallback = (status: IoTStatus) => void;

export interface ScenarioInfo {
  id: string;
  label: string;
  duration: number;
}

export interface IIoTService {
  readonly source: IoTSource;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribeToReadings(callback: SensorReadingCallback): () => void;
  subscribeToStatus(callback: StatusCallback): () => void;
  getStatus(): IoTStatus;
  getAvailableScenarios(): Promise<ScenarioInfo[]>;
  triggerScenario(scenarioId: string): Promise<boolean>;
  clearScenario(): Promise<void>;
}