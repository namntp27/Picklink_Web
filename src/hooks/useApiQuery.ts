import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

/**
 * Last successful value per query key, kept for the life of the tab.
 *
 * `apiRequest` already collapses duplicate in-flight reads and replays recent responses, but it
 * hands back a promise: a screen still mounts empty and paints a spinner before the microtask
 * resolves. This store lets a revisited screen render its previous data on the very first frame
 * while the refresh happens behind it.
 */
const resultStore = new Map<string, unknown>();
const subscribers = new Map<string, Set<() => void>>();

export type QueryKey = string | ReadonlyArray<unknown>;

const serializeKey = (key: QueryKey) => (typeof key === 'string' ? key : JSON.stringify(key));

const publish = (key: string, data: unknown) => {
  resultStore.set(key, data);
  subscribers.get(key)?.forEach((notify) => notify());
};

const subscribe = (key: string, notify: () => void) => {
  const listeners = subscribers.get(key) ?? new Set<() => void>();
  listeners.add(notify);
  subscribers.set(key, listeners);

  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) subscribers.delete(key);
  };
};

export type ApiQueryResult<T> = {
  data: T | undefined;
  error: string;
  /** True only when there is nothing to show yet — a revisit with cached data never sets this. */
  loading: boolean;
  /** True while a refresh runs over data that is already on screen. */
  refreshing: boolean;
  refresh: () => Promise<void>;
  /** Applies a local change (optimistic update) and shares it with every screen on this key. */
  setData: (updater: T | ((current: T | undefined) => T)) => void;
};

type UseApiQueryOptions = {
  enabled?: boolean;
  errorMessage?: string;
};

/**
 * Reads an API resource keyed by `key`, rendering the last known value immediately.
 *
 * Fold every dependency that changes what `loader` fetches into `key`, so a key change starts a
 * new read instead of reusing the previous answer.
 */
export const useApiQuery = <T>(
  key: QueryKey,
  loader: () => Promise<T>,
  { enabled = true, errorMessage = 'Không thể tải dữ liệu.' }: UseApiQueryOptions = {},
): ApiQueryResult<T> => {
  const cacheKey = serializeKey(key);
  const [data, setLocalData] = useState<T | undefined>(() => resultStore.get(cacheKey) as T | undefined);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  // Guards against a superseded read (older key, or a refresh overtaken by a newer one) writing
  // its result over the current one. Requests themselves are left to finish: their responses stay
  // useful to the shared client cache even when this screen no longer wants them.
  const latestRunRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Keep the rendered value in step with the key even before the effect below runs, so switching
  // pages or filters never shows the previous key's data.
  const renderedKeyRef = useRef(cacheKey);
  if (renderedKeyRef.current !== cacheKey) {
    renderedKeyRef.current = cacheKey;
    setLocalData(resultStore.get(cacheKey) as T | undefined);
    setError('');
  }

  const run = useCallback(async () => {
    const runId = latestRunRef.current + 1;
    latestRunRef.current = runId;

    setRefreshing(true);
    try {
      const result = await loaderRef.current();
      if (!mountedRef.current || latestRunRef.current !== runId) return;
      publish(cacheKey, result);
      setError('');
    } catch (requestError) {
      if (!mountedRef.current || latestRunRef.current !== runId) return;
      setError(requestError instanceof ApiError ? requestError.message : errorMessage);
    } finally {
      if (mountedRef.current && latestRunRef.current === runId) setRefreshing(false);
    }
  }, [cacheKey, errorMessage]);

  useEffect(() => {
    if (!enabled) return undefined;

    const unsubscribe = subscribe(cacheKey, () => {
      setLocalData(resultStore.get(cacheKey) as T | undefined);
    });
    void run();

    return unsubscribe;
  }, [cacheKey, enabled, run]);

  const setData = useCallback((updater: T | ((current: T | undefined) => T)) => {
    const next = typeof updater === 'function'
      ? (updater as (current: T | undefined) => T)(resultStore.get(cacheKey) as T | undefined)
      : updater;
    publish(cacheKey, next);
  }, [cacheKey]);

  return {
    data,
    error,
    loading: enabled && data === undefined && error === '',
    refreshing,
    refresh: run,
    setData,
  };
};

/**
 * Drops every remembered value. Call on sign-out so the next account never sees the previous
 * account's screens.
 */
export const clearApiQueryCache = () => {
  resultStore.clear();
  subscribers.forEach((listeners) => listeners.forEach((notify) => notify()));
};
