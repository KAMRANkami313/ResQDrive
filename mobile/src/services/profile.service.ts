import { supabase } from '@api/supabase';
import { storageService } from './storage.service';
import { UserProfile } from '@app-types/index';

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  cnic?: string;
  blood_group?: string;
  allergies?: string;
  avatar_url?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

function mapError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data as UserProfile;
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) return { user: null, error: mapError(error) };
      return { user: data as UserProfile, error: null };
    } catch (err) {
      return { user: null, error: mapError(err) };
    }
  },

  async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const path = `${userId}/avatar.jpg`;
      const url = await storageService.uploadFile('avatars', path, imageUri);
      if (!url) return { url: null, error: 'Failed to upload avatar' };
      const { error } = await this.updateProfile(userId, { avatar_url: url });
      if (error) return { url: null, error };
      return { url, error: null };
    } catch (err) {
      return { url: null, error: mapError(err) };
    }
  },

  async changePassword({ currentPassword, newPassword }: ChangePasswordInput): Promise<{ error: string | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.email) {
        return { error: 'No active session found' };
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.session.user.email,
        password: currentPassword,
      });
      if (signInError) {
        return { error: 'Current password is incorrect' };
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        return { error: mapError(updateError) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapError(err) };
    }
  },
};