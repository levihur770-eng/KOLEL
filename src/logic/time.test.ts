import { describe, expect, it } from 'vitest';
import { addDays, atLocalTime, formatDate, formatDuration, localDateOf, minutesBetween, timeOf } from './time';

describe('time (always Europe/Budapest)', () => {
  it('shows the Budapest day and clock time of a moment', () => {
    // Winter: Budapest is UTC+1.
    expect(timeOf('2026-11-16T19:47:03.000Z')).toBe('20:47');
    expect(localDateOf('2026-11-16T19:47:03.000Z')).toBe('2026-11-16');
    // Summer: UTC+2.
    expect(timeOf('2026-07-01T18:30:00.000Z')).toBe('20:30');
  });

  it('a late-evening moment belongs to the Budapest day, not the UTC day', () => {
    expect(localDateOf('2026-07-01T22:30:00.000Z')).toBe('2026-07-02');
    expect(timeOf('2026-07-01T22:30:00.000Z')).toBe('00:30');
  });

  it('turns a typed clock time back into the exact moment', () => {
    expect(atLocalTime('2026-11-16', '20:47')).toBe('2026-11-16T19:47:00.000Z');
    expect(atLocalTime('2026-07-01', '20:30')).toBe('2026-07-01T18:30:00.000Z');
  });

  it('is right on the days the clocks change', () => {
    // 25 Oct 2026: clocks go back at 03:00. 29 Mar 2026: forward at 02:00.
    expect(atLocalTime('2026-10-25', '20:30')).toBe('2026-10-25T19:30:00.000Z');
    expect(atLocalTime('2026-10-25', '01:30')).toBe('2026-10-24T23:30:00.000Z');
    expect(atLocalTime('2026-03-29', '20:30')).toBe('2026-03-29T18:30:00.000Z');
    expect(timeOf(atLocalTime('2026-03-29', '08:15'))).toBe('08:15');
  });

  it('counts whole minutes and formats durations', () => {
    expect(minutesBetween('2026-11-16T19:47:00.000Z', '2026-11-16T19:47:59.000Z')).toBe(0);
    expect(minutesBetween('2026-11-16T19:47:00.000Z', '2026-11-16T19:59:10.000Z')).toBe(12);
    expect(minutesBetween('2026-11-16T19:47:00.000Z', '2026-11-16T19:45:30.000Z')).toBe(-2);
    expect(formatDuration(23 * 60000)).toBe('0:23');
    expect(formatDuration(65 * 60000 + 59000)).toBe('1:05');
    expect(formatDuration(-5)).toBe('0:00');
  });

  it('formats and shifts days', () => {
    expect(formatDate('2026-11-16')).toBe('Mon 16 Nov 2026');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
