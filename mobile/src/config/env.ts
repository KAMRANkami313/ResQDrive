type AppEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiBaseUrl: string;
  crashSoundServiceUrl: string;
  damageServiceUrl: string;
  repairCostServiceUrl: string;
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

  const base = aiBaseUrl || 'http://localhost:8000';
  return {
    supabaseUrl,
    supabaseAnonKey,
    aiBaseUrl: base,
    crashSoundServiceUrl: process.env.EXPO_PUBLIC_CRASH_SOUND_URL || 'http://localhost:8001',
    damageServiceUrl: process.env.EXPO_PUBLIC_DAMAGE_SERVICE_URL || 'http://localhost:8002',
    repairCostServiceUrl: process.env.EXPO_PUBLIC_REPAIR_COST_URL || 'http://localhost:8003',
  };
}

export const env = getEnv();