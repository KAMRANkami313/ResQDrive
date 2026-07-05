import { useEffect, useState } from 'react';
import { severityService } from '@services/severity';
import { SeverityAssessment } from '@services/severity';

export function useSeverityAssessment() {
  const [assessment, setAssessment] = useState<SeverityAssessment | null>(
    severityService.getLastAssessment(),
  );

  useEffect(() => {
    const unsub = severityService.onAssessment(setAssessment);
    return unsub;
  }, []);

  return assessment;
}

export function useSeverityConfig() {
  const [config, setConfig] = useState(severityService.getConfig());

  useEffect(() => {
    const interval = setInterval(() => {
      const next = severityService.getConfig();
      setConfig(next);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const update = (patch: Partial<typeof config>) => {
    severityService.updateConfig(patch);
    setConfig(severityService.getConfig());
  };

  return { config, update };
}