/**
 * Times. Moments are stored as UTC text (Iso); the day and the clock time a
 * person sees are always Europe/Budapest, whatever the phone is set to.
 */
import type { Iso, LocalDate } from '../data/types';

export const TIME_ZONE = 'Europe/Budapest';

const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function parts(ms: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of partsFormat.formatToParts(new Date(ms))) out[p.type] = p.value;
  return out;
}

/** The Budapest calendar day of a moment: "2026-11-16". */
export function localDateOf(iso: Iso): LocalDate {
  const p = parts(Date.parse(iso));
  return `${p.year}-${p.month}-${p.day}`;
}

/** The Budapest clock time of a moment: "20:47". */
export function timeOf(iso: Iso): string {
  const p = parts(Date.parse(iso));
  return `${p.hour}:${p.minute}`;
}

/** How far Budapest's clock is ahead of UTC at that moment, in ms. */
function offsetMs(ms: number): number {
  const p = parts(ms);
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wall - Math.floor(ms / 1000) * 1000;
}

/** The moment at which Budapest clocks show `hhmm` on `localDate`. */
export function atLocalTime(localDate: LocalDate, hhmm: string): Iso {
  const [y, m, d] = localDate.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  // Two steps so the days on which the clocks change come out right.
  const first = wall - offsetMs(wall);
  return new Date(wall - offsetMs(first)).toISOString();
}

/** Whole minutes from `from` to `to` (negative if `to` is earlier). */
export function minutesBetween(from: Iso, to: Iso): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 60000);
}

/** "0:23", "1:05" (hours:minutes). */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** "Mon 16 Nov 2026" */
export function formatDate(localDate: LocalDate): string {
  return dateFormat.format(new Date(`${localDate}T00:00:00Z`)).replace(',', '');
}

export function addDays(localDate: LocalDate, days: number): LocalDate {
  const d = new Date(`${localDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
