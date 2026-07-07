import { supabase } from '@api/supabase';
import { ContactNotificationRecord } from './types';

type AckCallback = (incidentId: string, contact: ContactNotificationRecord) => void;

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_DURATION_MS = 600000;

class AckService {
  private subscriptions: Map<string, ReturnType<typeof supabase.channel>> = new Map();
  private pollingByIncident: Map<string, ReturnType<typeof setInterval>> = new Map();
  private callbacks: Set<AckCallback> = new Set();
  private knownAckTimestamps: Map<string, string> = new Map();

  onAcknowledgment(callback: AckCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  subscribeToIncident(incidentId: string): void {
    if (this.subscriptions.has(incidentId)) return;

    console.log('[ack] subscribing to incident:', incidentId);

    const channel = supabase
      .channel(`incident-ack-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'incidents',
          filter: `id=eq.${incidentId}`,
        },
        (payload: any) => {
          console.log('[ack] realtime event received');
          this.handleIncidentUpdate(incidentId, payload.new);
        },
      )
      .subscribe((status: string) => {
        console.log('[ack] subscription status:', status);
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.startPolling(incidentId);
        }
      });

    this.subscriptions.set(incidentId, channel);
    this.startPolling(incidentId);
  }

  private startPolling(incidentId: string): void {
    if (this.pollingByIncident.has(incidentId)) return;

    console.log('[ack] starting polling fallback for:', incidentId);

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('id, acknowledged_by, acknowledged_by_name, acknowledged_at')
          .eq('id', incidentId)
          .single();

        if (error) return;
        this.handleIncidentUpdate(incidentId, data);
      } catch (err) {
        // silent
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    this.pollingByIncident.set(incidentId, interval);

    setTimeout(() => {
      if (this.pollingByIncident.has(incidentId)) {
        this.stopPolling(incidentId);
      }
    }, POLL_MAX_DURATION_MS);
  }

  private stopPolling(incidentId: string): void {
    const interval = this.pollingByIncident.get(incidentId);
    if (interval) {
      clearInterval(interval);
      this.pollingByIncident.delete(incidentId);
    }
  }

  private handleIncidentUpdate(incidentId: string, record: any): void {
    if (!record) return;

    const ackedBy = record.acknowledged_by;
    const ackedByName = record.acknowledged_by_name;
    const ackedAt = record.acknowledged_at;

    if (!ackedBy || !ackedByName) return;

    const knownTimestamp = this.knownAckTimestamps.get(incidentId);
    if (knownTimestamp === ackedAt) return;
    this.knownAckTimestamps.set(incidentId, ackedAt);

    console.log('[ack] acknowledgment detected:', { ackedByName, ackedAt });

    const contact: ContactNotificationRecord = {
      contactId: ackedBy,
      contactName: ackedByName,
      contactPhone: '',
      contactEmail: '',
      priority: 0,
      notifiedAt: 0,
      channels: [],
      acknowledged: true,
    };

    this.callbacks.forEach((cb) => cb(incidentId, contact));
  }

  unsubscribeFromIncident(incidentId: string): void {
    const channel = this.subscriptions.get(incidentId);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(incidentId);
    }
    this.stopPolling(incidentId);
    this.knownAckTimestamps.delete(incidentId);
  }

  async acknowledgeIncident(
    incidentId: string,
    contactId: string,
    contactName: string,
  ): Promise<boolean> {
    try {
      console.log('[ack] sending ack:', { contactId, contactName });

      const updatePayload = {
        acknowledged_by: contactId,
        acknowledged_by_name: contactName,
        acknowledged_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('incidents')
        .update(updatePayload)
        .eq('id', incidentId)
        .select();

      if (error) {
        console.error('[ack] update error:', error.message);
        return false;
      }

      console.log('[ack] update succeeded');
      this.handleIncidentUpdate(incidentId, data?.[0] || { ...updatePayload, id: incidentId });
      return true;
    } catch (err) {
      console.error('[ack] failed:', err);
      return false;
    }
  }

  unsubscribeAll(): void {
    for (const [id] of this.subscriptions) {
      this.unsubscribeFromIncident(id);
    }
  }
}

export const ackService = new AckService();