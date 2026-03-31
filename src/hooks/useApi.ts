import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(fetchFn: () => Promise<T>, deps: any[] = []): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFnRef.current()
      .then(d => { setData(d); setError(null); })
      .catch(e => {
        if (e instanceof ApiError) setError(e.message);
        else setError('Something went wrong');
      })
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useApiMutation<T, V = any>(
  mutateFn: (vars: V) => Promise<T>
): { mutate: (vars: V) => Promise<T>; loading: boolean; error: string | null } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (vars: V): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutateFn(vars);
      return result;
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  return { mutate, loading, error };
}
