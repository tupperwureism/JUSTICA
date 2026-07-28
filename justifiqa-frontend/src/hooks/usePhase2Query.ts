import { useCallback, useEffect, useRef, useState } from 'react';
import { safePhase2MutationError } from './phase2MutationState.ts';

export function usePhase2Query<TData>(loader: () => Promise<TData>) {
  const loaderRef = useRef(loader);
  const requestIdRef = useRef(0);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  loaderRef.current = loader;

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const nextData = await loaderRef.current();
      if (requestId === requestIdRef.current) setData(nextData);
      return nextData;
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(safePhase2MutationError(loadError));
      }
      throw loadError;
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh().catch(() => undefined);
    return () => {
      requestIdRef.current += 1;
    };
  }, [refresh]);

  return { data, error, isLoading, refresh };
}
