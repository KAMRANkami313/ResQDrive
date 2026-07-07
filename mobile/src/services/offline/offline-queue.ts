import { Platform } from 'react-native';
import { QueuedAlert, QueuedAlertStatus, QueuedAlertType } from './types';
import type { SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'resqdrive_offline';
const STORAGE_KEY = 'resqdrive_offline_queue';

interface OfflineQueueBackend {
  init(): Promise<void>;
  enqueue(alert: Omit<QueuedAlert, 'id' | 'status' | 'attempts' | 'createdAt' | 'lastAttemptAt' | 'error'>): Promise<string | null>;
  getPending(): Promise<QueuedAlert[]>;
  getByIncident(incidentId: string): Promise<QueuedAlert[]>;
  updateStatus(id: string, status: QueuedAlertStatus, error: string | null): Promise<void>;
  markSent(id: string): Promise<void>;
  clearSent(): Promise<void>;
  clearAll(): Promise<void>;
  count(): Promise<number>;
}

class WebLocalStorageBackend implements OfflineQueueBackend {
  private initialized = false;

  private readAll(): QueuedAlert[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as QueuedAlert[];
    } catch {
      return [];
    }
  }

  private writeAll(queue: QueuedAlert[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[offline-queue-web] write failed:', err);
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('[offline-queue-web] localStorage not available');
      return;
    }
    this.initialized = true;
    console.log('[offline-queue-web] initialized');
  }

  async enqueue(alert: Omit<QueuedAlert, 'id' | 'status' | 'attempts' | 'createdAt' | 'lastAttemptAt' | 'error'>): Promise<string | null> {
    await this.init();
    const id = `${alert.type}-${alert.incidentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const newItem: QueuedAlert = {
      ...alert,
      id,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      lastAttemptAt: null,
      error: null,
    };
    const queue = this.readAll();
    queue.push(newItem);
    this.writeAll(queue);
    console.log('[offline-queue-web] enqueued:', id);
    return id;
  }

  async getPending(): Promise<QueuedAlert[]> {
    await this.init();
    return this.readAll()
      .filter((a) => a.status === 'pending' || a.status === 'failed')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async getByIncident(incidentId: string): Promise<QueuedAlert[]> {
    await this.init();
    return this.readAll().filter((a) => a.incidentId === incidentId);
  }

  async updateStatus(id: string, status: QueuedAlertStatus, error: string | null = null): Promise<void> {
    const queue = this.readAll();
    const idx = queue.findIndex((a) => a.id === id);
    if (idx === -1) return;
    queue[idx] = {
      ...queue[idx],
      status,
      lastAttemptAt: Date.now(),
      error,
      attempts: queue[idx].attempts + 1,
    };
    this.writeAll(queue);
  }

  async markSent(id: string): Promise<void> {
    const queue = this.readAll();
    const idx = queue.findIndex((a) => a.id === id);
    if (idx === -1) return;
    queue[idx] = {
      ...queue[idx],
      status: 'sent',
      lastAttemptAt: Date.now(),
      error: null,
    };
    this.writeAll(queue);
  }

  async clearSent(): Promise<void> {
    const queue = this.readAll().filter((a) => a.status !== 'sent');
    this.writeAll(queue);
  }

  async clearAll(): Promise<void> {
    this.writeAll([]);
  }

  async count(): Promise<number> {
    return this.readAll().length;
  }
}

class NativeSQLiteBackend implements OfflineQueueBackend {
    private db: SQLiteDatabase | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const SQLite = await import('expo-sqlite');
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS alert_queue (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          incident_id TEXT NOT NULL,
          recipient_name TEXT,
          recipient_phone TEXT,
          recipient_email TEXT,
          payload TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 3,
          created_at INTEGER NOT NULL,
          last_attempt_at INTEGER,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_alert_queue_status ON alert_queue(status);
        CREATE INDEX IF NOT EXISTS idx_alert_queue_incident ON alert_queue(incident_id);
      `);
      this.initialized = true;
      console.log('[offline-queue-native] initialized');
    } catch (err) {
      console.error('[offline-queue-native] init failed:', err);
    }
  }

  async enqueue(alert: Omit<QueuedAlert, 'id' | 'status' | 'attempts' | 'createdAt' | 'lastAttemptAt' | 'error'>): Promise<string | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const id = `${alert.type}-${alert.incidentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    try {
      await this.db.runAsync(
        `INSERT INTO alert_queue (id, type, incident_id, recipient_name, recipient_phone, recipient_email, payload, status, attempts, max_attempts, created_at, last_attempt_at, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, NULL, NULL)`,
        id, alert.type, alert.incidentId, alert.recipientName || null, alert.recipientPhone || null, alert.recipientEmail || null, alert.payload, alert.maxAttempts, now,
      );
      console.log('[offline-queue-native] enqueued:', id);
      return id;
    } catch (err) {
      console.error('[offline-queue-native] enqueue failed:', err);
      return null;
    }
  }

  async getPending(): Promise<QueuedAlert[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];
    try {
      const rows = await this.db.getAllAsync(
        `SELECT * FROM alert_queue WHERE status IN ('pending', 'failed') ORDER BY created_at ASC`,
      );
      return (rows as any[]).map(this.mapRow);
    } catch (err) {
      console.error('[offline-queue-native] getPending failed:', err);
      return [];
    }
  }

  async getByIncident(incidentId: string): Promise<QueuedAlert[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];
    try {
      const rows = await this.db.getAllAsync(
        `SELECT * FROM alert_queue WHERE incident_id = ? ORDER BY created_at ASC`,
        incidentId,
      );
      return (rows as any[]).map(this.mapRow);
    } catch {
      return [];
    }
  }

  async updateStatus(id: string, status: QueuedAlertStatus, error: string | null = null): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.runAsync(
        `UPDATE alert_queue SET status = ?, last_attempt_at = ?, error = ?, attempts = attempts + 1 WHERE id = ?`,
        status, Date.now(), error, id,
      );
    } catch (err) {
      console.error('[offline-queue-native] updateStatus failed:', err);
    }
  }

  async markSent(id: string): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.runAsync(
        `UPDATE alert_queue SET status = 'sent', last_attempt_at = ?, error = NULL WHERE id = ?`,
        Date.now(), id,
      );
    } catch (err) {
      console.error('[offline-queue-native] markSent failed:', err);
    }
  }

  async clearSent(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.runAsync(`DELETE FROM alert_queue WHERE status = 'sent'`);
    } catch (err) {
      console.error('[offline-queue-native] clearSent failed:', err);
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.runAsync(`DELETE FROM alert_queue`);
    } catch (err) {
      console.error('[offline-queue-native] clearAll failed:', err);
    }
  }

  async count(): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) return 0;
    try {
      const row = await this.db.getFirstAsync(`SELECT COUNT(*) as cnt FROM alert_queue`) as { cnt?: number } | null;
      return row?.cnt || 0;
    } catch {
      return 0;
    }
  }

  private mapRow = (row: any): QueuedAlert => ({
    id: row.id,
    type: row.type as QueuedAlertType,
    incidentId: row.incident_id,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    recipientEmail: row.recipient_email,
    payload: row.payload,
    status: row.status as QueuedAlertStatus,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    createdAt: row.created_at,
    lastAttemptAt: row.last_attempt_at,
    error: row.error,
  });
}

class OfflineQueue implements OfflineQueueBackend {
  private backend: OfflineQueueBackend;

  constructor() {
    if (Platform.OS === 'web') {
      this.backend = new WebLocalStorageBackend();
    } else {
      this.backend = new NativeSQLiteBackend();
    }
  }

  init(): Promise<void> {
    return this.backend.init();
  }

  enqueue(alert: Omit<QueuedAlert, 'id' | 'status' | 'attempts' | 'createdAt' | 'lastAttemptAt' | 'error'>): Promise<string | null> {
    return this.backend.enqueue(alert);
  }

  getPending(): Promise<QueuedAlert[]> {
    return this.backend.getPending();
  }

  getByIncident(incidentId: string): Promise<QueuedAlert[]> {
    return this.backend.getByIncident(incidentId);
  }

  updateStatus(id: string, status: QueuedAlertStatus, error: string | null): Promise<void> {
    return this.backend.updateStatus(id, status, error);
  }

  markSent(id: string): Promise<void> {
    return this.backend.markSent(id);
  }

  clearSent(): Promise<void> {
    return this.backend.clearSent();
  }

  clearAll(): Promise<void> {
    return this.backend.clearAll();
  }

  count(): Promise<number> {
    return this.backend.count();
  }
}

export const offlineQueue = new OfflineQueue();