import { describe, expect, it } from 'vitest';
import type { ClassGroup, Session, Student } from '../data/types';
import * as marks from './marks';

const NOW = '2026-11-16T19:50:00.000Z';
const LATER = '2026-11-17T08:00:00.000Z';
const cls: ClassGroup = { id: 'c', name: 'Class', teacherIds: ['local'], studentIds: ['a', 'b', 'x'], usualStart: '20:30', archived: false };
const students: Student[] = [
  { id: 'a', name: 'A', active: true, joinedDate: '2026-01-01' },
  { id: 'b', name: 'B', active: true, joinedDate: '2026-01-01' },
  { id: 'x', name: 'X', active: false, joinedDate: '2026-01-01' },
];
const fresh = (): Session => marks.newSession({ id: 's', cls, rosterIds: marks.activeRoster(cls, students), now: NOW });

describe('a new session', () => {
  it('copies the usual start, takes the Budapest day, lists active students only, and has no times yet', () => {
    const s = fresh();
    expect(s).toMatchObject({ classId: 'c', localDate: '2026-11-16', scheduledStart: '20:30', openedAt: NOW, endCheckTaken: false, rosterIds: ['a', 'b'], marks: {} });
    expect(s.startedAt).toBeUndefined();
    expect(s.endedAt).toBeUndefined();
  });
  it('a forgotten session takes the day it is given', () => {
    expect(marks.newSession({ id: 's', cls, rosterIds: [], now: NOW, localDate: '2026-11-10' }).localDate).toBe('2026-11-10');
  });
});

describe('ticking', () => {
  it('during class stores the moment and no editedAt', () => {
    expect(marks.tickPresent(fresh(), 'a', NOW, false).marks.a).toEqual({ arrivedAt: NOW });
  });
  it('in a correction stores "time unknown", stamped', () => {
    expect(marks.tickPresent(fresh(), 'a', LATER, true).marks.a).toEqual({ timeUnknown: true, editedAt: LATER });
  });
  it('"Everyone here" ticks only those with no mark yet', () => {
    const s = marks.everyoneHere(marks.setAbsent(fresh(), 'a'), ['a', 'b'], NOW, false);
    expect(s.marks.a).toEqual({ absent: true });
    expect(s.marks.b).toEqual({ arrivedAt: NOW });
  });
  it('never changes the session it was given', () => {
    const s = fresh();
    marks.tickPresent(s, 'a', NOW, false);
    expect(s.marks).toEqual({});
  });
});

describe('the student menu', () => {
  const ticked = () => marks.tickPresent(fresh(), 'a', NOW, false);
  it('absent replaces presence; undo removes the mark', () => {
    const absent = marks.setAbsent(ticked(), 'a');
    expect(absent.marks.a).toEqual({ absent: true });
    expect(marks.clearMark(absent, 'a').marks).toEqual({});
  });
  it('a typed arrival time makes the student present and is stamped', () => {
    const s = marks.setArrival(marks.setAbsent(fresh(), 'a'), 'a', NOW, LATER);
    expect(s.marks.a).toEqual({ arrivedAt: NOW, editedAt: LATER });
  });
  it('"time not known" drops the arrival time', () => {
    expect(marks.setTimeUnknown(ticked(), 'a', LATER).marks.a).toEqual({ timeUnknown: true, editedAt: LATER });
  });
  it('excused: a late student stays present; a student with no mark becomes absent and excused', () => {
    expect(marks.setExcused(ticked(), 'a', true, ' Doctor ').marks.a).toEqual({ arrivedAt: NOW, excused: true, reason: 'Doctor' });
    expect(marks.setExcused(fresh(), 'b', true, undefined).marks.b).toEqual({ absent: true, excused: true });
    expect(marks.setExcused(fresh(), 'b', false, undefined).marks).toEqual({});
  });
  it('removing the excuse removes its reason', () => {
    const s = marks.setExcused(marks.setExcused(ticked(), 'a', true, 'Doctor'), 'a', false, 'Doctor');
    expect(s.marks.a).toEqual({ arrivedAt: NOW });
  });
  it('left early only applies to a present student and can be removed', () => {
    expect(marks.setLeft(fresh(), 'a', NOW).marks).toEqual({});
    const left = marks.setLeft(ticked(), 'a', LATER);
    expect(left.marks.a).toEqual({ arrivedAt: NOW, leftAt: LATER });
    expect(marks.setLeft(left, 'a', undefined).marks.a).toEqual({ arrivedAt: NOW });
  });
});

describe('start, end and the end-of-class register', () => {
  it('sets and clears start and end', () => {
    const s = marks.setEnd(marks.setStart(fresh(), NOW), LATER);
    expect(s).toMatchObject({ startedAt: NOW, endedAt: LATER });
    const cleared = marks.setEnd(marks.setStart(s, undefined), undefined);
    expect('startedAt' in cleared).toBe(false);
    expect('endedAt' in cleared).toBe(false);
  });
  it('ending without the end register records nothing about it', () => {
    const s = marks.setEnd(marks.tickPresent(fresh(), 'a', NOW, false), LATER);
    expect(s.endCheckTaken).toBe(false);
    expect(s.marks.a.endPresent).toBeUndefined();
  });
  it('the end register marks present students only, and can be removed again', () => {
    let s = marks.tickPresent(fresh(), 'a', NOW, false);
    s = marks.tickPresent(s, 'b', NOW, false);
    s = marks.setAbsent(s, 'x');
    const checked = marks.saveEndCheck(s, ['a']);
    expect(checked.endCheckTaken).toBe(true);
    expect(checked.marks.a.endPresent).toBe(true);
    expect(checked.marks.b.endPresent).toBe(false);
    expect(checked.marks.x).toEqual({ absent: true });
    expect(marks.clearEndCheck(checked)).toEqual(s);
  });
  it('an unchanged note changes nothing (so a session only looked at is not saved)', () => {
    const s = fresh();
    expect(marks.setNote(s, '  ')).toBe(s);
    expect(marks.setNote(s, ' Short class ').note).toBe('Short class');
  });
});
