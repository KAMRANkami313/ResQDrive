import { Linking, Platform } from 'react-native';
import { supabase } from '@api/supabase';
import { escalationService } from '@services/escalation';
import {
  DEFAULT_SOS_CONFIG,
  EmergencyNumber,
  PakistaniRegion,
  SosConfig,
  SosState,
  SosUpdateCallback,
} from './types';
import { detectRegion} from './region-detector';

class SosService {
  private config: SosConfig = DEFAULT_SOS_CONFIG;
  private state: SosState = {
    isActive: false,
    region: 'default',
    regionLabel: 'Pakistan (Default)',
    emergencyNumbers: [],
    customNumbers: [],
    autoDialTriggered: false,
    autoDialCountdown: null,
    incidentId: null,
    errorMessage: null,
  };
  private autoDialTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private callbacks: Set<SosUpdateCallback> = new Set();

  updateConfig(config: Partial<SosConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getState(): SosState {
    return { ...this.state };
  }

  onUpdate(callback: SosUpdateCallback): () => void {
    this.callbacks.add(callback);
    callback(this.state);
    return () => this.callbacks.delete(callback);
  }

  async activate(incidentId: string, lat: number, lng: number): Promise<void> {
    try {
      const { region, label } = detectRegion(lat, lng);
      const numbers = await this.fetchEmergencyNumbers(region);

      this.state = {
        ...this.state,
        isActive: true,
        region,
        regionLabel: label,
        emergencyNumbers: numbers,
        incidentId,
        autoDialTriggered: false,
        autoDialCountdown: this.config.autoDialEnabled ? Math.ceil(this.config.autoDialDelayMs / 1000) : null,
        errorMessage: null,
      };
      this.notifyUpdate();

      if (this.config.autoDialEnabled) {
        this.startAutoDialCountdown();
      }

      console.log('[sos] activated for region:', region, 'numbers:', numbers.length);
    } catch (err) {
      console.error('[sos] activate failed:', err);
      this.state = {
        ...this.state,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
      this.notifyUpdate();
    }
  }

  async callNumber(phone: string, serviceName: string): Promise<boolean> {
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const url = Platform.OS === 'ios' ? `telprompt:${cleanPhone}` : `tel:${cleanPhone}`;

      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        if (Platform.OS === 'web') {
          window.alert(`Cannot make phone calls on web. Please dial manually: ${phone} (${serviceName})`);
          return false;
        }
        console.error('[sos] tel: URL not supported');
        return false;
      }

      await Linking.openURL(url);
      console.log('[sos] calling:', phone, '(', serviceName, ')');
      return true;
    } catch (err) {
      console.error('[sos] call failed:', err);
      return false;
    }
  }

  dismiss(): void {
    this.clearTimers();
    this.state = {
      ...this.state,
      isActive: false,
      autoDialCountdown: null,
      autoDialTriggered: false,
    };
    this.notifyUpdate();
    console.log('[sos] dismissed');
  }

  private async fetchEmergencyNumbers(region: PakistaniRegion): Promise<EmergencyNumber[]> {
    try {
      const { data, error } = await supabase
        .from('emergency_numbers')
        .select('*')
        .or(`region.eq.${region},region.eq.default`)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const all = (data || []) as EmergencyNumber[];
      const regionNumbers = all.filter((n) => n.region === region);
      const defaultNumbers = all.filter((n) => n.region === 'default');
      const seen = new Set<string>();
      const merged: EmergencyNumber[] = [];

      for (const n of regionNumbers) {
        if (!seen.has(n.phone)) {
          merged.push(n);
          seen.add(n.phone);
        }
      }
      for (const n of defaultNumbers) {
        if (!seen.has(n.phone)) {
          merged.push(n);
          seen.add(n.phone);
        }
      }

      return merged;
    } catch (err) {
      console.error('[sos] fetch numbers failed:', err);
      return this.getFallbackNumbers(region);
    }
  }

  private getFallbackNumbers(region: PakistaniRegion): EmergencyNumber[] {
    const fallback: Record<string, EmergencyNumber[]> = {
      karachi: [
        { id: 'f1', region: 'karachi', serviceName: 'Edhi Foundation', phone: '115', description: 'Edhi Ambulance', isActive: true, sortOrder: 1 },
        { id: 'f2', region: 'karachi', serviceName: 'Chhipa Welfare', phone: '1020', description: 'Chhipa Ambulance', isActive: true, sortOrder: 2 },
      ],
      punjab: [
        { id: 'f3', region: 'punjab', serviceName: 'Rescue 1122', phone: '1122', description: 'Punjab Emergency Service', isActive: true, sortOrder: 1 },
      ],
      islamabad: [
        { id: 'f4', region: 'islamabad', serviceName: 'Rescue 1122', phone: '1122', description: 'Islamabad Emergency Service', isActive: true, sortOrder: 1 },
      ],
      kpk: [
        { id: 'f5', region: 'kpk', serviceName: 'Rescue 1122', phone: '1122', description: 'KPK Emergency Service', isActive: true, sortOrder: 1 },
      ],
      sindh: [
        { id: 'f6', region: 'sindh', serviceName: 'Edhi Foundation', phone: '115', description: 'Edhi Ambulance', isActive: true, sortOrder: 1 },
      ],
      balochistan: [
        { id: 'f7', region: 'balochistan', serviceName: 'Edhi Foundation', phone: '115', description: 'Edhi Ambulance', isActive: true, sortOrder: 1 },
      ],
      default: [
        { id: 'f8', region: 'default', serviceName: 'Rescue 1122', phone: '1122', description: 'Default Emergency', isActive: true, sortOrder: 1 },
        { id: 'f9', region: 'default', serviceName: 'Edhi Foundation', phone: '115', description: 'Nationwide Ambulance', isActive: true, sortOrder: 2 },
      ],
    };
    return fallback[region] || fallback.default;
  }

  private startAutoDialCountdown(): void {
    const startTime = Date.now();
    const totalMs = this.config.autoDialDelayMs;

    this.countdownTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      this.state = { ...this.state, autoDialCountdown: remaining };
      this.notifyUpdate();

      if (remaining <= 0) {
        this.triggerAutoDial();
      }
    }, 1000);

    this.autoDialTimer = setTimeout(() => {
      this.triggerAutoDial();
    }, totalMs);
  }

  private async triggerAutoDial(): Promise<void> {
    this.clearTimers();

    if (this.state.autoDialTriggered) return;
    this.state = { ...this.state, autoDialTriggered: true, autoDialCountdown: 0 };
    this.notifyUpdate();

    const escalationState = escalationService.getState();
    if (escalationState.status === 'running' && escalationState.contacts.length > 0) {
      console.log('[sos] escalation still running, skipping auto-dial (will be triggered by escalation if needed)');
      return;
    }

    if (this.state.emergencyNumbers.length > 0) {
      const topNumber = this.state.emergencyNumbers[0];
      console.log('[sos] auto-dialing:', topNumber.phone);
      await this.callNumber(topNumber.phone, topNumber.serviceName);
    }
  }

  private clearTimers(): void {
    if (this.autoDialTimer) {
      clearTimeout(this.autoDialTimer);
      this.autoDialTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private notifyUpdate(): void {
    this.callbacks.forEach((cb) => cb(this.state));
  }
}

export const sosService = new SosService();
export { detectRegion, getRegionLabel } from './region-detector';
export { DEFAULT_SOS_CONFIG } from './types';
export type { SosState, SosConfig, EmergencyNumber, PakistaniRegion } from './types';