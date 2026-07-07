import { supabase } from '@api/supabase';
import { Incident } from '@app-types/index';
import { SeverityAssessment } from '@services/severity';
import { SensorReading } from '@services/iot/types';

export interface CreateIncidentInput {
  vehicleId: string | null;
  severity: SeverityAssessment['level'];
  severityScore: number;
  latitude: number | null;
  longitude: number | null;
  address?: string;
  sensorSnapshot: SensorReading | null;
}

export const incidentService = {
  async create(input: CreateIncidentInput): Promise<Incident | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        console.error('[incident] no auth session');
        return null;
      }
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          user_id: session.session.user.id,
          vehicle_id: input.vehicleId,
          severity: input.severity,
          status: 'dispatched',
          latitude: input.latitude,
          longitude: input.longitude,
          address: input.address || '',
          occurred_at: new Date().toISOString(),
          sensor_snapshot: {
            severity_score: input.severityScore,
            reading: input.sensorSnapshot,
          },
          alert_dispatch_status: {},
        })
        .select()
        .single();
      if (error) {
        console.error('[incident] insert error:', error.message);
        return null;
      }
      return data as Incident;
    } catch (err) {
      console.error('[incident] create exception:', err);
      return null;
    }
  },

  async updateDispatchStatus(incidentId: string, status: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ alert_dispatch_status: status, status: 'dispatched' })
        .eq('id', incidentId);
      return !error;
    } catch (err) {
      console.error('[incident] update error:', err);
      return false;
    }
  },

    async updateEscalationStatus(incidentId: string, escalation: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ escalation_status: escalation })
        .eq('id', incidentId);
      if (error) {
        console.error('[incident] escalation update error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[incident] escalation update exception:', err);
      return false;
    }
  },

  async list(): Promise<Incident[]> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(50);
      if (error) return [];
      return (data || []) as Incident[];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Incident | null> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as Incident;
    } catch {
      return null;
    }
  },
};