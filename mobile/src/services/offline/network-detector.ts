import NetInfo from '@react-native-community/netinfo';
import { NetworkChangeCallback, NetworkState } from './types';

class NetworkDetector {
  private currentState: NetworkState = {
    isOnline: true,
    type: 'unknown',
    isConnected: true,
    isInternetReachable: true,
    details: null,
  };
  private unsubscribe: (() => void) | null = null;
  private callbacks: Set<NetworkChangeCallback> = new Set();
  private manualOverride: boolean | null = null;

  init(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = NetInfo.addEventListener((state) => {
      this.currentState = {
        isOnline: this.manualOverride !== null ? this.manualOverride : !!state.isConnected,
        type: (state.type as any) || 'unknown',
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
      };
      this.callbacks.forEach((cb) => cb(this.currentState));
    });
  }

  getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  isOnline(): boolean {
    return this.currentState.isOnline;
  }

  setManualOverride(online: boolean | null): void {
    this.manualOverride = online;
    if (online !== null) {
      this.currentState = {
        ...this.currentState,
        isOnline: online,
        isConnected: online,
      };
      this.callbacks.forEach((cb) => cb(this.currentState));
    }
  }

  onChange(callback: NetworkChangeCallback): () => void {
    this.callbacks.add(callback);
    callback(this.currentState);
    return () => this.callbacks.delete(callback);
  }

  async checkNow(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();
      this.currentState = {
        isOnline: this.manualOverride !== null ? this.manualOverride : !!state.isConnected,
        type: (state.type as any) || 'unknown',
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
      };
      return this.currentState;
    } catch (err) {
      console.warn('[network] check failed:', err);
      return this.currentState;
    }
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const networkDetector = new NetworkDetector();