import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const requireEnvironmentValue = (name: string, value: string | undefined): string => {
  if (!value?.trim()) {
    throw new Error(
      `Konfigurasi Supabase belum lengkap. Tambahkan ${name} ke berkas .env.local lalu mulai ulang aplikasi.`,
    );
  }

  return value;
};

const supabaseUrl = requireEnvironmentValue('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = requireEnvironmentValue(
  'VITE_SUPABASE_ANON_KEY',
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
