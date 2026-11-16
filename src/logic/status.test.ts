import { describe, expect, it } from 'vitest';
import type { Mark, Session } from '../data/types';
import { countsOf, inProgress, isRecorded, rosterOf, statusOf } from './status';

const START = '2026-11-16T19:47:00.000Z';
const at = (minutes: number, seconds = 0) => new Date(Date.parse(START) + minutes * 60000 + seconds * 1000).toISOString();
const NO_GRACE = { graceMinutes: 0 };

function session(marks: Record<string, Mark>, extra: Partial<Session> = {}): Session {
  return { id: 's', classId: 'c', teacherId: 'local', localDate: '2026-11-16', openedAt: at(-10), startedAt: START, endCheckTaken: false, rosterIds: ['a', 'b', 'c'], marks, ...extra };
}

describe('status of a student in a session', () => {
  it('a session with no marks at all is "not recorded" for everyone (P2)', () => {
    const s = session({});
    expect(isRecorded(s)).toBe(false);
    expect(statusOf(s, 'a', NO_GRACE).kind).toBe('notRecorded');
    expect(countsOf(s, NO_GRACE)).toEqual({ recorded: false, roster: 3, present: 0, late: 0, absent: 0 });
  });

  it('ticked before Start was pressed is on time', () => {
    expect(statusOf(session({ a: { arrivedAt: at(-3) } }), 'a', NO_GRACE).kind).toBe('onTime');
  });

  it('ticked within the first minute after Start is on time, never "late 0 min"', () => {
    expect(statusOf(session({ a: { arrivedAt: at(0, 40) } }), 'a', NO_GRACE).kind).toBe('onTime');
  });

  it('ticked later is late, in whole minutes from the start', () => {
    expect(statusOf(session({ a: { arrivedAt: at(12, 30) } }), 'a', NO_GRACE)).toMatchObject({ kind: 'late', minutesLate: 12 });
    expect(statusOf(session({ a: { arrivedAt: at(1) } }), 'a', NO_GRACE)).toMatchObject({ kind: 'late', minutesLate: 1 });
  });

  it('the grace period decides on time or late, but the minutes still count from the start', () => {
    const s = session({ a: { arrivedAt: at(5) }, b: { arrivedAt: at(6) } });
    expect(statusOf(s, 'a', { graceMinutes: 5 }).kind).toBe('onTime');
    expect(statusOf(s, 'b', { graceMinutes: 5 })).toMatchObject({ kind: 'late', minutesLate: 6 });
  });

  it('changing the start time by hand changes the judgement, not the stored tick', () => {
    const s = session({ a: { arrivedAt: at(-2) } });
    expect(statusOf({ ...s, startedAt: at(-5) }, 'a', NO_GRACE)).toMatchObject({ kind: 'late', minutesLate: 3 });
  });

  it('time unknown counts as present, with no lateness', () => {
    expect(statusOf(session({ a: { timeUnknown: true } }), 'a', NO_GRACE).kind).toBe('presentTimeUnknown');
  });

  it('with no start time there is only present or absent', () => {
    const s = session({ a: { arrivedAt: at(30) } }, { startedAt: undefined });
    expect(statusOf(s, 'a', NO_GRACE).kind).toBe('present');
    expect(statusOf(s, 'b', NO_GRACE)).toMatchObject({ kind: 'absent', explicit: false });
  });

  it('absent: marked by hand, or simply not ticked when others were', () => {
    const s = session({ a: { arrivedAt: at(-1) }, b: { absent: true } });
    expect(statusOf(s, 'b', NO_GRACE)).toMatchObject({ kind: 'absent', explicit: true, excused: false });
    expect(statusOf(s, 'c', NO_GRACE)).toMatchObject({ kind: 'absent', explicit: false });
  });

  it('carries excused and its reason, for absence and for lateness', () => {
    const s = session({ a: { absent: true, excused: true, reason: 'Wedding' }, b: { arrivedAt: at(9), excused: true } });
    expect(statusOf(s, 'a', NO_GRACE)).toMatchObject({ kind: 'absent', excused: true, reason: 'Wedding' });
    expect(statusOf(s, 'b', NO_GRACE)).toMatchObject({ kind: 'late', excused: true });
  });

  it('left early: a leaving time, or missing at the end register; endPresent means nothing without that register', () => {
    const marks = { a: { arrivedAt: at(-1), leftAt: at(40) }, b: { arrivedAt: at(-1), endPresent: false }, c: { arrivedAt: at(-1), endPresent: true } };
    const taken = session(marks, { endCheckTaken: true });
    expect(statusOf(taken, 'a', NO_GRACE).leftEarly).toBe(true);
    expect(statusOf(taken, 'b', NO_GRACE).leftEarly).toBe(true);
    expect(statusOf(taken, 'c', NO_GRACE).leftEarly).toBe(false);
    expect(statusOf(session(marks), 'b', NO_GRACE).leftEarly).toBe(false);
  });

  it('the roster is the list of that day plus anyone with a mark', () => {
    const s = session({ z: { timeUnknown: true } });
    expect(rosterOf(s)).toEqual(['a', 'b', 'c', 'z']);
    // A student who joined the class later is not on an old session's list, so not absent there.
    expect(rosterOf(s)).not.toContain('joined-later');
  });

  it('counts present, late and absent', () => {
    const s = session({ a: { arrivedAt: at(-1) }, b: { arrivedAt: at(7) } });
    expect(countsOf(s, NO_GRACE)).toEqual({ recorded: true, roster: 3, present: 2, late: 1, absent: 1 });
  });
});

describe('class in progress', () => {
  const today = '2026-11-16';
  it('is a session of today, begun (started or ticked) and not ended', () => {
    const started = session({});
    const ticked = session({ a: { arrivedAt: at(-1) } }, { startedAt: undefined });
    expect(inProgress([started], 'c', today)?.id).toBe('s');
    expect(inProgress([ticked], 'c', today)?.id).toBe('s');
  });
  it('is not an ended session, another day, another class, or a register only looked at', () => {
    expect(inProgress([session({}, { endedAt: at(60) })], 'c', today)).toBeUndefined();
    expect(inProgress([session({}, { localDate: '2026-11-15' })], 'c', today)).toBeUndefined();
    expect(inProgress([session({})], 'other', today)).toBeUndefined();
    expect(inProgress([session({}, { startedAt: undefined })], 'c', today)).toBeUndefined();
  });
});
