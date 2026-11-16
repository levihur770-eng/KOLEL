/** Moving between screens. The address after # says which screen is shown (see App.tsx). */
import { useEffect, useState } from 'react';

/** Go to a screen, e.g. go('/people'). The address after # is the screen. */
export function go(path: string): void {
  location.hash = path;
}

/** The current screen address split in parts: "#/class/abc" -> ["class", "abc"]. */
export function useRoute(): string[] {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
}

export function newId(): string {
  return crypto.randomUUID();
}
