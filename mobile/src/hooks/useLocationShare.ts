import { useEffect, useState } from 'react';
import { locationShareService } from '@services/location-share';
import { LocationShareState } from '@services/location-share';

export function useLocationShare() {
  const [state, setState] = useState<LocationShareState>(locationShareService.getState());

  useEffect(() => {
    const unsub = locationShareService.onUpdate(setState);
    return unsub;
  }, []);

  return state;
}