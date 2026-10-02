import { supabase } from '@/lib/supabase';
import { getPortalRole, type PortalRole } from '@/types/portalAuth';

interface PortalRegistration {
  email: string;
  password: string;
  role: Exclude<PortalRole, 'ADMIN'>;
  fullName: string;
  metadata: Record<string, string>;
}

export async function signInPortal(email: string, password: string, expectedRole: PortalRole) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (getPortalRole(data.user) !== expectedRole) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Peran akun tidak sesuai dengan portal autentikasi yang dipilih.');
  }
  return data.session;
}

export async function registerPortal(registration: PortalRegistration) {
  const { data, error } = await supabase.auth.signUp({
    email: registration.email,
    password: registration.password,
    options: {
      data: {
        ...registration.metadata,
        role: registration.role,
        full_name: registration.fullName,
      },
    },
  });
  if (error) throw error;
  if (data.session) await supabase.auth.signOut({ scope: 'local' });
  return data.user;
}

export async function signOutPortal() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export function authErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Autentikasi gagal. Silakan coba kembali.';
}
