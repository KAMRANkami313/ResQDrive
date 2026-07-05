import { supabase } from '@api/supabase';

export const storageService = {
  async uploadFile(bucket: string, path: string, uri: string): Promise<string | null> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: true });
      if (error) {
        console.warn('[storage] upload error:', error.message);
        return null;
      }
      return this.getPublicUrl(bucket, path);
    } catch (err) {
      console.warn('[storage] upload exception:', err);
      return null;
    }
  },

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      return !error;
    } catch {
      return false;
    }
  },
};