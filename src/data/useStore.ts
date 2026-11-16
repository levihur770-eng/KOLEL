/** How screens reach the Store: `useStore()` to write, `useLive()` to read and stay up to date. */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Store } from './store';

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreContext is missing');
  return store;
}

/** Loads something from the store and loads it again after every change. undefined while loading. */
export function useLive<T>(load: (store: Store) => Promise<T>): T | undefined {
  const store = useStore();
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let stopped = false;
    const refresh = () =>
      void load(store).then(
        (v) => !stopped && setValue(v),
        () => undefined,
      );
    refresh();
    const unsubscribe = store.subscribe(refresh);
    return () => {
      stopped = true;
      unsubscribe();
    };
    // `load` is a new function on every render; the store decides when to reload.
  }, [store]); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}

/** The current moment, refreshed every `everyMs`. */
export function useNow(everyMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}
