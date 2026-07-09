import { supabase } from '@api/supabase';
import { useAuthStore } from '@stores/auth.store';
import { getIoTService } from '@services/iot';
import {
  DEFAULT_LOCATION_SHARE_CONFIG,
  LocationShareConfig,
  LocationShareState,
  LocationShareUpdateCallback,
  LocationUpdate,
} from './types';

const SHARE_BASE_URL = 'https://resqdrive.app/track';

class LocationShareService {
  private config: LocationShareConfig = DEFAULT_LOCATION_SHARE_CONFIG;
  private state: LocationShareState = {
    shareId: null,
    incidentId: null,
    shareToken: null,
    shareUrl: null,
    isActive: false,
    startedAt: null,
    lastUpdateAt: null,
    updateCount: 0,
    currentLocation: null,
    errorMessage: null,
    phase: 'ended',
  };
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: Set<LocationShareUpdateCallback> = new Set();
  private iotUnsub: (() => void) | null = null;
  private lastKnownLocation: LocationUpdate | null = null;

  async start(incidentId: string): Promise<{ shareUrl: string; shareToken: string } | null> {
    if (this.state.isActive) {
      console.warn('[location-share] already active');
      return { shareUrl: this.state.shareUrl!, shareToken: this.state.shareToken! };
    }

    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const iotService = getIoTService();
      const latestReading = await this.fetchInitialLocation(iotService);

      const insertPayload = {
        incident_id: incidentId,
        user_id: user.id,
        latitude: latestReading?.latitude ?? 33.6844,
        longitude: latestReading?.longitude ?? 73.0479,
        accuracy: latestReading?.accuracy ?? null,
        speed_kmh: latestReading?.speedKmh ?? null,
        heading: latestReading?.heading ?? null,
        is_active: true,
        started_at: new Date().toISOString(),
        last_update_at: new Date().toISOString(),
        location_history: latestReading ? [latestReading] : [],
      };

      const { data, error } = await supabase
        .from('location_shares')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const shareUrl = `${SHARE_BASE_URL}/${data.share_token}`;

      this.state = {
        shareId: data.id,
        incidentId,
        shareToken: data.share_token,
        shareUrl,
        isActive: true,
        startedAt: Date.now(),
        lastUpdateAt: Date.now(),
        updateCount: 1,
        currentLocation: latestReading,
        errorMessage: null,
        phase: 'fast',
      };
      this.notifyUpdate();

      this.iotUnsub = iotService.subscribeToReadings((reading) => {
        this.lastKnownLocation = {
          latitude: reading.gps.lat,
          longitude: reading.gps.lng,
          accuracy: reading.gps.accuracy,
          speedKmh: reading.gps.speed_kmh,
          heading: reading.gps.heading,
          timestamp: Date.now(),
        };
      });

      this.startUpdateLoop();
      this.startMaxDurationTimer();

      console.log('[location-share] started:', shareUrl);
      return { shareUrl, shareToken: data.share_token };
    } catch (err) {
      console.error('[location-share] start failed:', err);
      this.state = {
        ...this.state,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
      this.notifyUpdate();
      return null;
    }
  }

  stop(reason: string = 'manual'): void {
    if (!this.state.isActive) return;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.iotUnsub) {
      this.iotUnsub();
      this.iotUnsub = null;
    }

    if (this.state.shareId) {
      supabase
        .from('location_shares')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          last_update_at: new Date().toISOString(),
        })
        .eq('id', this.state.shareId)
        .then(() => console.log('[location-share] stopped in DB:', reason));
    }

    this.state = {
      ...this.state,
      isActive: false,
      phase: 'ended',
    };
    this.notifyUpdate();
    console.log('[location-share] stopped:', reason);
  }

  getState(): LocationShareState {
    return { ...this.state };
  }

  onUpdate(callback: LocationShareUpdateCallback): () => void {
    this.callbacks.add(callback);
    callback(this.state);
    return () => this.callbacks.delete(callback);
  }

  private async fetchInitialLocation(iotService: any): Promise<LocationUpdate | null> {
    try {
      const status = iotService.getStatus();
      if (status.connection !== 'connected') {
        await iotService.connect();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return null;
    } catch {
      return null;
    }
  }

  private startUpdateLoop(): void {
    const tick = async () => {
      if (!this.state.isActive || !this.state.shareId) return;

      const elapsed = Date.now() - (this.state.startedAt || 0);
      const isFastPhase = elapsed < this.config.fastPhaseDurationMs;
      const phase = isFastPhase ? 'fast' : 'slow';

      if (this.state.phase !== phase) {
        this.state = { ...this.state, phase };
        this.notifyUpdate();
        this.rescheduleTimer();
        return;
      }

      const location = this.lastKnownLocation || this.state.currentLocation;
      if (!location) return;

      await this.pushUpdate(location);
      this.resetInactivityTimer();
    };

    const interval = this.state.phase === 'fast'
      ? this.config.fastUpdateIntervalMs
      : this.config.slowUpdateIntervalMs;
    this.updateTimer = setInterval(tick, interval);
  }

  private rescheduleTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.startUpdateLoop();
  }

  private async pushUpdate(location: LocationUpdate): Promise<void> {
    if (!this.state.shareId) return;

    try {
      const { data: current } = await supabase
        .from('location_shares')
        .select('location_history')
        .eq('id', this.state.shareId)
        .single();

      const history = (current?.location_history as LocationUpdate[]) || [];
      const updatedHistory = [...history, location].slice(-200);

      const { error } = await supabase
        .from('location_shares')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed_kmh: location.speedKmh,
          heading: location.heading,
          last_update_at: new Date().toISOString(),
          location_history: updatedHistory,
        })
        .eq('id', this.state.shareId);

      if (error) throw error;

      this.state = {
        ...this.state,
        lastUpdateAt: Date.now(),
        updateCount: this.state.updateCount + 1,
        currentLocation: location,
      };
      this.notifyUpdate();
    } catch (err) {
      console.error('[location-share] push failed:', err);
    }
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      console.log('[location-share] inactivity timeout, stopping');
      this.stop('inactivity_timeout');
    }, this.config.inactivityTimeoutMs);
  }

  private startMaxDurationTimer(): void {
    this.maxDurationTimer = setTimeout(() => {
      console.log('[location-share] max duration reached, stopping');
      this.stop('max_duration');
    }, this.config.maxDurationMs);
  }

  private notifyUpdate(): void {
    this.callbacks.forEach((cb) => cb(this.state));
  }
}

export const locationShareService = new LocationShareService();
export { DEFAULT_LOCATION_SHARE_CONFIG } from './types';
export type { LocationShareState, LocationShareConfig, LocationUpdate } from './types';