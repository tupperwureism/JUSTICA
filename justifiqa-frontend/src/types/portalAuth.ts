import type { User } from '@supabase/supabase-js';

export type PortalRole = 'CLIENT' | 'ADVOCATE' | 'ADMIN';

export const portalHome: Record<PortalRole, string> = {
  CLIENT: '/client/dashboard',
  ADVOCATE: '/advocate/dashboard',
  ADMIN: '/admin/dashboard',
};

export const portalLogin: Record<PortalRole, string> = {
  CLIENT: '/client/login',
  ADVOCATE: '/advocate/login',
  ADMIN: '/admin/login',
};

export function getPortalRole(user: User | null): PortalRole | null {
  const role = user?.user_metadata.role;
  return role === 'CLIENT' || role === 'ADVOCATE' || role === 'ADMIN' ? role : null;
}

export function safePortalRedirect(value: string | null, role: PortalRole): string {
  const prefix = `/${role.toLowerCase()}/`;
  return value?.startsWith(prefix) && !value.startsWith('//') ? value : portalHome[role];
}
