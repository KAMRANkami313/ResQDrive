import { useEffect, useState } from 'react';
import { getIoTService } from '@services/iot';
import { IoTStatus, SensorReading } from '@services/iot';

export function useIoTStatus(): IoTStatus {
  const service = getIoTService();
  const [status, setStatus] = useState<IoTStatus>(service.getStatus());

  useEffect(() => {
    const unsub = service.subscribeToStatus(setStatus);
    return unsub;
  }, [service]);

  return status;
}

export function useSensorStream(enabled: boolean): SensorReading | null {
  const service = getIoTService();
  const [reading, setReading] = useState<SensorReading | null>(null);

  useEffect(() => {
    if (!enabled) {
      setReading(null);
      return;
    }
    const unsub = service.subscribeToReadings(setReading);
    return unsub;
  }, [service, enabled]);

  return reading;
}