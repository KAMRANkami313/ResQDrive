import { useCountdownVisible } from '@hooks/useCountdown';
import { CountdownScreen } from '@screens/accident/CountdownScreen';
import { SeverityAssessment } from '@services/severity';
import { useCallback } from 'react';

interface CountdownOverlayProps {
  onComplete: (assessment: SeverityAssessment) => void;
  onCancel: (reason: string) => void;
}

export function CountdownOverlay({ onComplete, onCancel }: CountdownOverlayProps) {
  const visible = useCountdownVisible();

  const handleComplete = useCallback((assessment: SeverityAssessment) => {
    onComplete(assessment);
  }, [onComplete]);

  const handleCancel = useCallback((reason: string) => {
    onCancel(reason);
  }, [onCancel]);

  if (!visible) return null;

  return <CountdownScreen onComplete={handleComplete} onCancel={handleCancel} />;
}