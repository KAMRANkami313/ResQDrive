import { useEffect, useState } from 'react';
import { offlineFallbackService, networkDetector } from '@services/offline';
import { QueuedAlert, NetworkState } from '@services/offline';

export function useNetworkState() {
  const [state, setState] = useState<NetworkState>(networkDetector.getCurrentState());

  useEffect(() => {
    const unsub = networkDetector.onChange(setState);
    return unsub;
  }, []);

  return state;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      const q = await offlineFallbackService.getQueue();
      setQueue(q);
      setLoading(false);
    };
    loadQueue();
    const unsub = offlineFallbackService.onQueueChange(setQueue);
    return unsub;
  }, []);

  return { queue, loading };
}