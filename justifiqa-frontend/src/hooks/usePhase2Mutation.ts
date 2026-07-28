import { useCallback, useReducer, useRef } from 'react';
import {
  createSingleFlightMutation,
  initialPhase2MutationState,
  phase2MutationReducer,
  safePhase2MutationError,
} from './phase2MutationState.ts';

type Options<TData> = {
  onSuccess?: (data: TData) => void | Promise<void>;
};

export function usePhase2Mutation<TInput, TData>(
  mutation: (input: TInput) => Promise<TData>,
  options: Options<TData> = {},
) {
  const [state, dispatch] = useReducer(
    phase2MutationReducer<TData>,
    initialPhase2MutationState,
  );
  const mutationRef = useRef(mutation);
  const onSuccessRef = useRef(options.onSuccess);
  const lastInputRef = useRef<TInput | null>(null);
  const hasLastInputRef = useRef(false);
  const runnerRef = useRef<((input: TInput) => Promise<TData>) | null>(null);
  mutationRef.current = mutation;
  onSuccessRef.current = options.onSuccess;

  if (!runnerRef.current) {
    runnerRef.current = createSingleFlightMutation(async (input: TInput) => {
      dispatch({ type: 'start' });
      lastInputRef.current = input;
      hasLastInputRef.current = true;
      try {
        const data = await mutationRef.current(input);
        await onSuccessRef.current?.(data);
        dispatch({ type: 'success', data });
        return data;
      } catch (error) {
        dispatch({ type: 'error', error: safePhase2MutationError(error) });
        throw error;
      }
    });
  }

  const execute = useCallback((input: TInput) => runnerRef.current!(input), []);
  const retry = useCallback(() => {
    if (!hasLastInputRef.current) return Promise.reject(new Error('Tidak ada permintaan untuk diulang.'));
    return runnerRef.current!(lastInputRef.current as TInput);
  }, []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return {
    ...state,
    isLoading: state.status === 'loading',
    execute,
    retry,
    reset,
  };
}
