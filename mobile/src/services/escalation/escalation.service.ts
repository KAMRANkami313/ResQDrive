import { contactService } from '@services/contact.service';
import { alertDispatchService } from '@services/alert/alert-dispatch.service';
import { incidentService } from '@services/alert/incident.service';
import { ackService } from './ack.service';
import {
  ContactNotificationRecord,
  DEFAULT_ESCALATION_CONFIG,
  EscalationAckCallback,
  EscalationCompleteCallback,
  EscalationConfig,
  EscalationStartInput,
  EscalationState,
  EscalationUpdateCallback,
} from './types';

class EscalationService {
  private config: EscalationConfig = DEFAULT_ESCALATION_CONFIG;
  private state: EscalationState = {
    status: 'idle',
    incidentId: null,
    startedAt: null,
    endedAt: null,
    currentPriority: 0,
    contacts: [],
    acknowledgedBy: null,
    acknowledgedAt: null,
    cancelReason: null,
    nextEscalationAt: null,
    errorMessage: null,
  };
  private escalationTimer: ReturnType<typeof setTimeout> | null = null;
  private updateCallbacks: Set<EscalationUpdateCallback> = new Set();
  private ackCallbacks: Set<EscalationAckCallback> = new Set();
  private completeCallbacks: Set<EscalationCompleteCallback> = new Set();
  private ackUnsub: (() => void) | null = null;
  private currentInput: EscalationStartInput | null = null;

  updateConfig(config: Partial<EscalationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  onUpdate(callback: EscalationUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    callback(this.state);
    return () => this.updateCallbacks.delete(callback);
  }

  onAcknowledge(callback: EscalationAckCallback): () => void {
    this.ackCallbacks.add(callback);
    return () => this.ackCallbacks.delete(callback);
  }

  onComplete(callback: EscalationCompleteCallback): () => void {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  async start(input: EscalationStartInput): Promise<void> {
    if (this.state.status === 'running') {
      console.warn('[escalation] already running, ignoring start');
      return;
    }

    try {
      const { contacts, error } = await contactService.list();
      if (error) throw new Error(error);
      if (contacts.length === 0) {
        throw new Error('No emergency contacts configured');
      }

      const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

      console.log('[escalation] loaded contacts:', sortedContacts.map((c) => ({
        id: c.id,
        name: c.name,
        priority: c.priority,
      })));

      this.currentInput = input;
      this.state = {
        status: 'running',
        incidentId: input.incidentId,
        startedAt: Date.now(),
        endedAt: null,
        currentPriority: 0,
        contacts: sortedContacts.map((c) => ({
          contactId: c.id,
          contactName: c.name,
          contactPhone: c.phone,
          contactEmail: c.email,
          priority: c.priority,
          notifiedAt: 0,
          channels: [],
          acknowledged: false,
        })),
        acknowledgedBy: null,
        acknowledgedAt: null,
        cancelReason: null,
        nextEscalationAt: null,
        errorMessage: null,
      };
      this.notifyUpdate();
      incidentService.updateEscalationStatus(input.incidentId, this.serializeState());

      ackService.subscribeToIncident(input.incidentId);
      this.ackUnsub = ackService.onAcknowledgment((incidentId, contact) => {
        console.log('[escalation] ack received for:', incidentId, contact.contactName);
        if (incidentId === this.state.incidentId) {
          this.handleAcknowledgment(contact);
        }
      });

      await this.notifyNextContact();
    } catch (err) {
      console.error('[escalation] start failed:', err);
      this.state = {
        ...this.state,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
        endedAt: Date.now(),
      };
      this.notifyUpdate();
      this.completeCallbacks.forEach((cb) => cb(this.state));
    }
  }

  cancel(reason: string): void {
    if (this.state.status !== 'running') return;
    this.clearTimer();
    this.state = {
      ...this.state,
      status: 'cancelled',
      cancelReason: reason,
      endedAt: Date.now(),
      nextEscalationAt: null,
    };
    this.notifyUpdate();
    if (this.state.incidentId) {
      incidentService.updateEscalationStatus(this.state.incidentId, this.serializeState());
    }
    this.cleanup();
    this.completeCallbacks.forEach((cb) => cb(this.state));
  }

  reset(): void {
    this.clearTimer();
    this.cleanup();
    this.currentInput = null;
    this.state = {
      status: 'idle',
      incidentId: null,
      startedAt: null,
      endedAt: null,
      currentPriority: 0,
      contacts: [],
      acknowledgedBy: null,
      acknowledgedAt: null,
      cancelReason: null,
      nextEscalationAt: null,
      errorMessage: null,
    };
    this.notifyUpdate();
  }

  getState(): EscalationState {
    return { ...this.state };
  }

  private async notifyNextContact(): Promise<void> {
    if (this.state.status !== 'running' || !this.currentInput) return;

    const input = this.currentInput;
    const nextContact = this.state.contacts.find(
      (c) => c.priority > this.state.currentPriority,
    );

    if (!nextContact) {
      this.state = {
        ...this.state,
        status: 'exhausted',
        endedAt: Date.now(),
        nextEscalationAt: null,
      };
      this.notifyUpdate();
      if (input.incidentId) {
        incidentService.updateEscalationStatus(input.incidentId, this.serializeState());
      }
      this.cleanup();
      this.completeCallbacks.forEach((cb) => cb(this.state));
      return;
    }

    console.log('[escalation] notifying contact:', nextContact.contactName, '(priority', nextContact.priority + ')');

    this.state = {
      ...this.state,
      currentPriority: nextContact.priority,
      nextEscalationAt: null,
    };
    this.notifyUpdate();

    const ackLink = `https://resqdrive.app/ack/${input.incidentId}/${nextContact.contactId}`;

    const payload = {
      incidentId: input.incidentId,
      userId: '',
      userName: input.userName,
      userPhone: input.userPhone,
      severity: input.severity.level,
      severityScore: input.severity.score,
      latitude: input.latitude,
      longitude: input.longitude,
      mapsLink: input.mapsLink,
      occurredAt: Date.now(),
      sensorSnapshot: input.sensorSnapshot,
      recipientName: nextContact.contactName,
      recipientPhone: nextContact.contactPhone,
      recipientEmail: nextContact.contactEmail,
      ackLink,
    };

    const dispatchResult = await alertDispatchService.dispatch({
      ...payload,
      incidentId: input.incidentId,
    });

    const notifiedAt = Date.now();
    this.state = {
      ...this.state,
      contacts: this.state.contacts.map((c) =>
        c.contactId === nextContact.contactId
          ? { ...c, notifiedAt, channels: dispatchResult.channels }
          : c
      ),
      nextEscalationAt: Date.now() + this.config.escalationDelayMs,
    };
    this.notifyUpdate();
    incidentService.updateEscalationStatus(input.incidentId, this.serializeState());

    this.escalationTimer = setTimeout(() => {
      this.notifyNextContact();
    }, this.config.escalationDelayMs);
  }

  private handleAcknowledgment(contact: ContactNotificationRecord): void {
    if (this.state.status !== 'running') return;

    console.log('[escalation] handling ack for:', contact.contactName, '(id:', contact.contactId + ')');

    this.clearTimer();

    const acknowledgedContact = this.state.contacts.find(
      (c) => c.contactId === contact.contactId,
    );

    this.state = {
      ...this.state,
      status: 'acknowledged',
      contacts: this.state.contacts.map((c) =>
        c.contactId === contact.contactId
          ? { ...c, acknowledged: true }
          : c
      ),
      acknowledgedBy: acknowledgedContact || contact,
      acknowledgedAt: Date.now(),
      endedAt: Date.now(),
      nextEscalationAt: null,
    };
    this.notifyUpdate();
    this.ackCallbacks.forEach((cb) => cb(this.state.acknowledgedBy!));
    this.completeCallbacks.forEach((cb) => cb(this.state));
    this.cleanup();

    if (this.state.incidentId) {
      incidentService.updateEscalationStatus(this.state.incidentId, this.serializeState());
      incidentService.updateDispatchStatus(this.state.incidentId, {
        escalation: this.state,
      });
    }
  }

  private clearTimer(): void {
    if (this.escalationTimer) {
      clearTimeout(this.escalationTimer);
      this.escalationTimer = null;
    }
  }

  private cleanup(): void {
    this.clearTimer();
    if (this.ackUnsub) {
      this.ackUnsub();
      this.ackUnsub = null;
    }
    if (this.state.incidentId) {
      ackService.unsubscribeFromIncident(this.state.incidentId);
    }
  }

  private notifyUpdate(): void {
    this.updateCallbacks.forEach((cb) => cb(this.state));
  }

  private serializeState(): Record<string, any> {
    return {
      status: this.state.status,
      startedAt: this.state.startedAt,
      endedAt: this.state.endedAt,
      currentPriority: this.state.currentPriority,
      nextEscalationAt: this.state.nextEscalationAt,
      acknowledgedBy: this.state.acknowledgedBy ? {
        contactId: this.state.acknowledgedBy.contactId,
        contactName: this.state.acknowledgedBy.contactName,
      } : null,
      acknowledgedAt: this.state.acknowledgedAt,
      cancelReason: this.state.cancelReason,
      errorMessage: this.state.errorMessage,
      contacts: this.state.contacts.map((c) => ({
        contactId: c.contactId,
        contactName: c.contactName,
        priority: c.priority,
        notifiedAt: c.notifiedAt,
        acknowledged: c.acknowledged,
        channelsSummary: c.channels.map((ch) => ({
          channel: ch.channel,
          status: ch.status,
        })),
      })),
    };
  }
}

export const escalationService = new EscalationService();
export { DEFAULT_ESCALATION_CONFIG } from './types';
export type {
  EscalationState,
  EscalationStatus,
  EscalationConfig,
  ContactNotificationRecord,
  EscalationStartInput,
} from './types';
