import {
  IIoTService,
  IoTSource,
  IoTStatus,
  ScenarioInfo,
  SensorReading,
  SensorReadingCallback,
  StatusCallback,
} from './types';

const SIMULATOR_BASE_URL = 'http://localhost:9000';
const RECONNECT_DELAY_MS = 3000;

export class SimulatorIoTService implements IIoTService {
  readonly source: IoTSource = 'simulator';

  private ws: WebSocket | null = null;
  private readingCallbacks: Set<SensorReadingCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private currentStatus: IoTStatus = {
    source: 'simulator',
    connection: 'disconnected',
    lastReadingAt: null,
    errorMessage: null,
  };
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private scenariosCache: ScenarioInfo[] | null = null;

  async connect(): Promise<void> {
    if (this.currentStatus.connection === 'connected' || this.currentStatus.connection === 'connecting') {
      return;
    }
    this.updateStatus({ connection: 'connecting', errorMessage: null });
    this.openWebSocket();
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.updateStatus({ connection: 'disconnected', lastReadingAt: null });
  }

  subscribeToReadings(callback: SensorReadingCallback): () => void {
    this.readingCallbacks.add(callback);
    return () => {
      this.readingCallbacks.delete(callback);
    };
  }

  subscribeToStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    callback(this.currentStatus);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  getStatus(): IoTStatus {
    return { ...this.currentStatus };
  }

  async getAvailableScenarios(): Promise<ScenarioInfo[]> {
    if (this.scenariosCache) return this.scenariosCache;
    try {
      const res = await fetch(`${SIMULATOR_BASE_URL}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const scenarios: ScenarioInfo[] = Object.entries(data.available_scenarios).map(
        ([id, info]: [string, any]) => ({
          id,
          label: info.label,
          duration: info.duration,
        }),
      );
      this.scenariosCache = scenarios;
      return scenarios;
    } catch (err) {
      throw new Error(`Failed to fetch scenarios: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async triggerScenario(scenarioId: string): Promise<boolean> {
    try {
      const res = await fetch(`${SIMULATOR_BASE_URL}/scenarios/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.ok === true;
    } catch {
      return false;
    }
  }

  async clearScenario(): Promise<void> {
    try {
      await fetch(`${SIMULATOR_BASE_URL}/scenarios/clear`, { method: 'POST' });
    } catch {
      // ignore
    }
  }

  private openWebSocket() {
    try {
      const wsUrl = SIMULATOR_BASE_URL.replace('http', 'ws') + '/sensors/stream';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.updateStatus({ connection: 'connected', errorMessage: null });
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const reading: SensorReading = {
            timestamp: raw.timestamp,
            source: 'simulator',
            scenario: raw.scenario,
            elapsed_in_scenario: raw.elapsed_in_scenario,
            accelerometer_g: raw.accelerometer_g,
            gyroscope_rads: raw.gyroscope_rads,
            gps: raw.gps,
          };
          this.readingCallbacks.forEach((cb) => cb(reading));
          this.updateStatus({ lastReadingAt: Date.now() });
        } catch (err) {
          console.warn('[iot] failed to parse reading:', err);
        }
      };

      this.ws.onerror = () => {
        this.updateStatus({
          connection: 'error',
          errorMessage: 'WebSocket connection error',
        });
      };

      this.ws.onclose = () => {
        if (this.currentStatus.connection === 'disconnected') return;
        this.updateStatus({ connection: 'error', errorMessage: 'Connection closed. Reconnecting...' });
        this.scheduleReconnect();
      };
    } catch (err) {
      this.updateStatus({
        connection: 'error',
        errorMessage: err instanceof Error ? err.message : 'Failed to open WebSocket',
      });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.currentStatus.connection !== 'disconnected') {
        this.openWebSocket();
      }
    }, RECONNECT_DELAY_MS);
  }

  private updateStatus(patch: Partial<IoTStatus>) {
    this.currentStatus = { ...this.currentStatus, ...patch };
    this.statusCallbacks.forEach((cb) => cb(this.currentStatus));
  }
}