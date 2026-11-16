/** Small helpers for student names. Names may be in Hebrew letters. */

/** A pasted list, one name per line: drops numbering, bullets, empty lines and repeats. */
export function parseNameList(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of text.split(/[\r\n;]+/)) {
    const name = line
      .replace(/^\s*(\d+\s*[.)\-:]|[-*•])\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names;
}

/** Up to two letters shown when a student has no photo. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = [...words[0]][0] ?? '';
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Alphabetical, works for Latin and Hebrew letters. */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}
