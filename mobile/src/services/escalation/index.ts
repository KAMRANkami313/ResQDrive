export { escalationService, DEFAULT_ESCALATION_CONFIG } from './escalation.service';
export { ackService } from './ack.service';
export type {
  EscalationState,
  EscalationStatus,
  EscalationConfig,
  ContactNotificationRecord,
  EscalationStartInput,
  EscalationUpdateCallback,
  EscalationAckCallback,
  EscalationCompleteCallback,
} from './types';