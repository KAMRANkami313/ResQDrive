import { useEffect, useState } from 'react';
import { alertDispatchService } from '@services/alert';
import { AlertChannelResult, AlertChannelType, AlertDispatchResult } from '@services/alert';

export function useAlertDispatch() {
  const [lastDispatch, setLastDispatch] = useState<AlertDispatchResult | null>(null);
  const [channelStatuses, setChannelStatuses] = useState<Record<AlertChannelType, AlertChannelResult | null>>({
    push: null,
    sms: null,
    email: null,
  });
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    const unsubDispatch = alertDispatchService.onDispatch((result) => {
      setLastDispatch(result);
      setIsDispatching(false);
    });
    const unsubChannel = alertDispatchService.onChannelStatus((channel, result) => {
      setChannelStatuses((prev) => ({ ...prev, [channel]: result }));
      if (result.status === 'sending' || result.status === 'retrying') {
        setIsDispatching(true);
      }
    });
    return () => {
      unsubDispatch();
      unsubChannel();
    };
  }, []);

  return {
    lastDispatch,
    channelStatuses,
    isDispatching,
  };
}