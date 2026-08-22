import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';

/**
 * Fetches `fn()` on mount and whenever `deps` change. Exposes { data, loading, error, refetch }.
 * `fn` must return a promise resolving to the payload to store in `data`.
 */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      setError(apiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
