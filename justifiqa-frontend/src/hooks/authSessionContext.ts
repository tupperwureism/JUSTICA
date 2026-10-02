import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { PortalRole } from '@/types/portalAuth';

export interface AuthSessionState {
  session: Session | null;
  role: PortalRole | null;
  loading: boolean;
}

export const AuthSessionContext = createContext<AuthSessionState | null>(null);
