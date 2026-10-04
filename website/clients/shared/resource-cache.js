import { useCallback, useEffect, useRef, useState } from 'react';

// Module-level resource cache shared by every page inside a subject client.
// It is a disposable browser cache: wiped on sign-out, scoped by explicit
// key prefixes (per user where the payload is user-specific) and never
// treated as authoritative — a fresh server response always replaces it.
const store = new Map();
const inflight = new Map();
const generations = new Map();
const listeners = new Map();
// Keys stored by preloadResource, with the time they landed. A reader that
// mounts while a preloaded value is this fresh uses it without revalidating.
const primed = new Map();
const PRIMED_FRESH_MS = 10000;

function emit(key) {
  const set = listeners.get(key);
  if (set) for (const listener of [...set]) listener();
}

export function peekResource(key) {
  return key != null ? store.get(key) : undefined;
}

export function setResourceValue(key, value) {
  if (key == null) return;
  store.set(key, value);
  emit(key);
}

// Drops cached values whose key starts with `prefix` and asks every mounted
// reader to revalidate. Readers keep showing their stale copy until the
// fresh response lands, so invalidation never blanks the UI.
export function invalidateResources(prefix) {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      primed.delete(key);
      generations.set(key, (generations.get(key) ?? 0) + 1);
      emit(key);
    }
  }
}

export function clearResourceCache() {
  // Invalidate promises already in flight before dropping their bookkeeping.
  // Otherwise an old response could repopulate a key after sign-out.
  const keys = new Set([...store.keys(), ...inflight.keys(), ...listeners.keys()]);
  for (const key of keys) generations.set(key, (generations.get(key) ?? 0) + 1);
  store.clear();
  inflight.clear();
  primed.clear();
  for (const key of [...listeners.keys()]) emit(key);
}

// Shared, de-duplicated fetch for one key. A request started before an
// invalidation is stale: it may still resolve but its result is discarded,
// and a newer request is started for the bumped generation.
function loadResource(key, fetcher, { prime = false } = {}) {
  const generation = generations.get(key) ?? 0;
  const pending = inflight.get(key);
  if (pending && pending.generation === generation) return pending.promise;
  const promise = Promise.resolve()
    .then(fetcher)
    .then((value) => {
      if ((generations.get(key) ?? 0) === generation) {
        store.set(key, value);
        if (prime) primed.set(key, Date.now());
        else primed.delete(key);
        emit(key);
      }
      if (inflight.get(key)?.promise === promise) inflight.delete(key);
      return value;
    })
    .catch((error) => {
      if (inflight.get(key)?.promise === promise) inflight.delete(key);
      throw error;
    });
  inflight.set(key, { generation, promise });
  return promise;
}

// Fetches `key` before any page reads it, so a screen can wait for all of
// its data and then render complete. The readers that mount straight after
// reuse the value instead of fetching it a second time.
export function preloadResource(key, fetcher) {
  if (key == null) return Promise.resolve(undefined);
  return loadResource(key, fetcher, { prime: true });
}

function isPrimed(key) {
  const at = primed.get(key);
  return store.has(key) && at != null && Date.now() - at < PRIMED_FRESH_MS;
}

// useResource(key, fetcher) gives pages stale-while-revalidate semantics:
// a page whose data was not preloaded renders its template immediately and
// streams data in; every later visit renders the cached response instantly
// while a quiet background request refreshes it. Pages therefore never flash
// a loading state when returning to a page they have already seen.
export function useResource(key, fetcher) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [state, setState] = useState(() => ({
    key,
    data: key != null ? store.get(key) ?? null : null,
    loading: key != null && !store.has(key),
    error: null,
  }));
  if (state.key !== key) {
    setState({
      key,
      data: key != null ? store.get(key) ?? null : null,
      loading: key != null && !store.has(key),
      error: null,
    });
  }

  useEffect(() => {
    if (key == null || typeof fetcherRef.current !== 'function') return undefined;
    let active = true;

    const run = () => {
      loadResource(key, () => fetcherRef.current())
        .then((value) => {
          if (active) setState((current) => ({ ...current, data: value, loading: false, error: null }));
        })
        .catch((cause) => {
          if (active) setState((current) => ({ ...current, loading: false, error: cause?.message || 'Request failed' }));
        });
    };

    if (!isPrimed(key)) run();

    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    const notify = () => {
      if (!active) return;
      if (store.has(key)) {
        setState((current) => ({ ...current, data: store.get(key), loading: false, error: null }));
      } else {
        run();
      }
    };
    set.add(notify);
    return () => {
      active = false;
      set.delete(notify);
      if (set.size === 0) listeners.delete(key);
    };
  }, [key]);

  const refresh = useCallback(() => {
    if (key == null) return;
    store.delete(key);
    primed.delete(key);
    generations.set(key, (generations.get(key) ?? 0) + 1);
    emit(key);
  }, [key]);

  return {
    ...(state.key === key
      ? state
      : { key, data: store.get(key) ?? null, loading: key != null && !store.has(key), error: null }),
    refresh,
  };
}
