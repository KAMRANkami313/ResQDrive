import { supabase } from '@api/supabase';
import { EmergencyContact } from '@app-types/index';

export interface CreateContactInput {
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  priority: number;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {}

export const MAX_EMERGENCY_CONTACTS = 5;

function mapError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const contactService = {
  async list(): Promise<{ contacts: EmergencyContact[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) return { contacts: [], error: mapError(error) };
      return { contacts: (data || []) as EmergencyContact[], error: null };
    } catch (err) {
      return { contacts: [], error: mapError(err) };
    }
  },

  async create(input: CreateContactInput): Promise<{ contact: EmergencyContact | null; error: string | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        return { contact: null, error: 'Not authenticated' };
      }
      const { count, error: countError } = await supabase
        .from('emergency_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.session.user.id);
      if (countError) return { contact: null, error: mapError(countError) };
      if ((count || 0) >= MAX_EMERGENCY_CONTACTS) {
        return { contact: null, error: `Maximum ${MAX_EMERGENCY_CONTACTS} emergency contacts allowed` };
      }
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: session.session.user.id,
          ...input,
        })
        .select()
        .single();
      if (error) return { contact: null, error: mapError(error) };
      return { contact: data as EmergencyContact, error: null };
    } catch (err) {
      return { contact: null, error: mapError(err) };
    }
  },

  async update(id: string, updates: UpdateContactInput): Promise<{ contact: EmergencyContact | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return { contact: null, error: mapError(error) };
      return { contact: data as EmergencyContact, error: null };
    } catch (err) {
      return { contact: null, error: mapError(err) };
    }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      return { error: error ? mapError(error) : null };
    } catch (err) {
      return { error: mapError(err) };
    }
  },

  async reorder(orderedIds: string[]): Promise<{ error: string | null }> {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase.from('emergency_contacts').update({ priority: index + 1 }).eq('id', id),
      );
      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error);
      return { error: firstError?.error ? mapError(firstError.error) : null };
    } catch (err) {
      return { error: mapError(err) };
    }
  },
};