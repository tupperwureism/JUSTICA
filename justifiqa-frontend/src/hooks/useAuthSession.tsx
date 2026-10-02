import { useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getPortalRole } from '@/types/portalAuth';
import { AuthSessionContext, type AuthSessionState } from './authSessionContext';

const initialState: AuthSessionState = { session: null, role: null, loading: true };
const sessionState = (session: Session | null): AuthSessionState => ({
  session,
  role: getPortalRole(session?.user ?? null),
  loading: false,
});

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(sessionState(session));
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState(sessionState(data.session));
    }).catch(() => {
      if (active) setState(sessionState(null));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>;
}
