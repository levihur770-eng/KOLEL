import { useEffect, useState } from 'react';

/**
 * Registers the service worker (`src/serviceWorker.js`, built as `sw.js`),
 * which keeps a copy of the app so it works without internet and can be
 * installed. Only in the built app, not in `npm run dev`.
 *
 * `updateReady` is true when a newer version has been downloaded and waits;
 * `applyUpdate` switches to it and reloads the page.
 */
export function useAppUpdate(): { updateReady: boolean; applyUpdate: () => void } {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let reg: ServiceWorkerRegistration | undefined;
    const watch = (r: ServiceWorkerRegistration) => {
      // Only a version that replaces a running one needs a reload.
      if (r.waiting && navigator.serviceWorker.controller) setWaiting(r.waiting);
      r.addEventListener('updatefound', () => {
        const next = r.installing;
        next?.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) setWaiting(next);
        });
      });
    };
    navigator.serviceWorker
      .register('/sw.js')
      .then((r) => {
        reg = r;
        watch(r);
      })
      .catch(() => undefined); // no copy for offline use; the app still works online
    // Look for a new version when the app comes back to the front, and every hour.
    const check = () => void reg?.update().catch(() => undefined);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(check, 60 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  const applyUpdate = () => {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    waiting.postMessage('skipWaiting');
  };

  return { updateReady: waiting !== null, applyUpdate };
}
