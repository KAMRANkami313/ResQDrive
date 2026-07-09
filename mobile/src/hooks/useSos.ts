import { useEffect, useState } from 'react';
import { sosService } from '@services/sos';
import { SosState } from '@services/sos';

export function useSos() {
  const [state, setState] = useState<SosState>(sosService.getState());

  useEffect(() => {
    const unsub = sosService.onUpdate(setState);
    return unsub;
  }, []);

  return state;
}

export function useSosVisible() {
  const state = useSos();
  return state.isActive;
}