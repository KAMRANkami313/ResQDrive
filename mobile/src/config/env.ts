type AppEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiBaseUrl: string;
};

function getEnv(): AppEnv {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const aiBaseUrl = process.env.EXPO_PUBLIC_AI_BASE_URL;

  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is missing in .env');
  }
  if (!supabaseAnonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing in .env');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    aiBaseUrl: aiBaseUrl || 'http://localhost:8000',
  };
}

export const env = getEnv();