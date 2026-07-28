import { Phase2IntegrationError } from '../services/phase2IntegrationService.ts';

export type Phase2MutationStatus = 'idle' | 'loading' | 'success' | 'error';

export type Phase2MutationState<TData> = {
  status: Phase2MutationStatus;
  data: TData | null;
  error: string | null;
};

export type Phase2MutationAction<TData> =
  | { type: 'start' }
  | { type: 'success'; data: TData }
  | { type: 'error'; error: string }
  | { type: 'reset' };

export const initialPhase2MutationState: Phase2MutationState<never> = {
  status: 'idle',
  data: null,
  error: null,
};

export function phase2MutationReducer<TData>(
  _state: Phase2MutationState<TData>,
  action: Phase2MutationAction<TData>,
): Phase2MutationState<TData> {
  if (action.type === 'start') return { status: 'loading', data: null, error: null };
  if (action.type === 'success') return { status: 'success', data: action.data, error: null };
  if (action.type === 'error') return { status: 'error', data: null, error: action.error };
  return initialPhase2MutationState;
}

export function safePhase2MutationError(error: unknown) {
  if (error instanceof Phase2IntegrationError) return error.message;
  return 'Permintaan gagal diproses. Silakan coba kembali.';
}

export function createSingleFlightMutation<TArgs extends unknown[], TResult>(
  mutation: (...args: TArgs) => Promise<TResult>,
) {
  let inFlight: Promise<TResult> | null = null;
  return (...args: TArgs): Promise<TResult> => {
    if (inFlight) return inFlight;
    const current = mutation(...args);
    inFlight = current;
    void current.finally(() => {
      if (inFlight === current) inFlight = null;
    }).catch(() => undefined);
    return current;
  };
}
