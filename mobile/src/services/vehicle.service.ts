import { supabase } from '@api/supabase';
import { Vehicle } from '@app-types/index';

export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  is_primary?: boolean;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {}

function mapError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const vehicleService = {
  async list(): Promise<{ vehicles: Vehicle[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) return { vehicles: [], error: mapError(error) };
      return { vehicles: (data || []) as Vehicle[], error: null };
    } catch (err) {
      return { vehicles: [], error: mapError(err) };
    }
  },

  async create(input: CreateVehicleInput): Promise<{ vehicle: Vehicle | null; error: string | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        return { vehicle: null, error: 'Not authenticated' };
      }
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          user_id: session.session.user.id,
          ...input,
        })
        .select()
        .single();
      if (error) return { vehicle: null, error: mapError(error) };
      return { vehicle: data as Vehicle, error: null };
    } catch (err) {
      return { vehicle: null, error: mapError(err) };
    }
  },

  async update(id: string, updates: UpdateVehicleInput): Promise<{ vehicle: Vehicle | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return { vehicle: null, error: mapError(error) };
      return { vehicle: data as Vehicle, error: null };
    } catch (err) {
      return { vehicle: null, error: mapError(err) };
    }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      return { error: error ? mapError(error) : null };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  async setPrimary(id: string): Promise<{ error: string | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        return { error: 'Not authenticated' };
      }
      const userId = session.session.user.id;
      await supabase.from('vehicles').update({ is_primary: false }).eq('user_id', userId);
      const { error } = await supabase.from('vehicles').update({ is_primary: true }).eq('id', id);
      return { error: error ? mapError(error) : null };
    } catch (err) {
      return { error: mapError(err) };
    }
  },
};