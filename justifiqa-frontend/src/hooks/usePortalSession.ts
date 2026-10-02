import { useContext } from 'react';
import { AuthSessionContext, type AuthSessionState } from './authSessionContext';

export function usePortalSession(): AuthSessionState {
  const state = useContext(AuthSessionContext);
  if (!state) throw new Error('usePortalSession harus digunakan di dalam AuthSessionProvider.');
  return state;
}
