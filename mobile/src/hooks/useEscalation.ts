import { useEffect, useState } from 'react';
import { escalationService } from '@services/escalation';
import { EscalationState } from '@services/escalation';

export function useEscalation() {
  const [state, setState] = useState<EscalationState>(escalationService.getState());

  useEffect(() => {
    const unsub = escalationService.onUpdate(setState);
    return unsub;
  }, []);

  return state;
}

export function useEscalationVisible() {
  const state = useEscalation();
  return state.status === 'running';
}