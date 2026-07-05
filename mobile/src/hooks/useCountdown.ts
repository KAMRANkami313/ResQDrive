import { useEffect, useState } from 'react';
import { countdownService } from '@services/countdown';
import { CountdownState } from '@services/countdown';

export function useCountdown() {
  const [state, setState] = useState<CountdownState>(countdownService.getState());

  useEffect(() => {
    const unsub = countdownService.onUpdate(setState);
    return unsub;
  }, []);

  return state;
}

export function useCountdownVisible() {
  const state = useCountdown();
  return state.status === 'running' || state.status === 'cancelled' || state.status === 'dispatched';
}