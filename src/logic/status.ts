/**
 * Turns the stored facts of a session into judgements (on time, late,
 * absent ...). Nothing here is ever stored (P1), so the rules can change
 * later without touching old data. Change with care: run `npm test`.
 */
import type { LocalDate, Mark, SchoolSettings, Session } from '../data/types';
import { minutesBetween } from './time';

export type StatusKind =
  /** No register was taken in this session. Never counts against anyone (P2). */
  | 'notRecorded'
  | 'onTime'
  | 'late'
  /** Present, ticked afterwards: counts as present, ignored for punctuality. */
  | 'presentTimeUnknown'
  /** Present, but "Start class" was never pressed, so no lateness. */
  | 'present'
  | 'absent';

export interface Status {
  kind: StatusKind;
  /** Only for 'late': whole minutes after the class started. */
  minutesLate?: number;
  /** Only for 'absent': true = marked absent by hand, false = simply not ticked. */
  explicit?: boolean;
  excused: boolean;
  reason?: string;
  /** Left early: a leaving time, or missing at the end-of-class register. */
  leftEarly: boolean;
}

export function isPresent(mark: Mark | undefined): boolean {
  return !!mark && !mark.absent && (!!mark.arrivedAt || !!mark.timeUnknown);
}

/** A session with no marks at all = no register taken. */
export function isRecorded(session: Session): boolean {
  return Object.keys(session.marks).length > 0;
}

/** Everyone the session is about: the class list of that day plus anyone with a mark. */
export function rosterOf(session: Session): string[] {
  const ids = [...session.rosterIds];
  for (const id of Object.keys(session.marks)) if (!ids.includes(id)) ids.push(id);
  return ids;
}

export function statusOf(session: Session, studentId: string, settings: Pick<SchoolSettings, 'graceMinutes'>): Status {
  if (!isRecorded(session)) return { kind: 'notRecorded', excused: false, leftEarly: false };
  const mark = session.marks[studentId];
  const excused = !!mark?.excused;
  const reason = mark?.reason || undefined;
  if (!mark || !isPresent(mark)) return { kind: 'absent', explicit: !!mark, excused, reason, leftEarly: false };

  const leftEarly = !!mark.leftAt || (session.endCheckTaken && mark.endPresent === false);
  const base = { excused, reason, leftEarly };
  if (mark.timeUnknown || !mark.arrivedAt) return { kind: 'presentTimeUnknown', ...base };
  if (!session.startedAt) return { kind: 'present', ...base };
  // Whole minutes: under one full minute after the start is on time, so the
  // app never says "late 0 min". Late = more whole minutes than the grace.
  const minutes = minutesBetween(session.startedAt, mark.arrivedAt);
  if (minutes <= Math.max(0, settings.graceMinutes)) return { kind: 'onTime', ...base };
  return { kind: 'late', minutesLate: minutes, ...base };
}

export interface SessionCounts {
  recorded: boolean;
  roster: number;
  present: number;
  late: number;
  absent: number;
}

export function countsOf(session: Session, settings: Pick<SchoolSettings, 'graceMinutes'>): SessionCounts {
  const roster = rosterOf(session);
  const counts: SessionCounts = { recorded: isRecorded(session), roster: roster.length, present: 0, late: 0, absent: 0 };
  if (!counts.recorded) return counts;
  for (const id of roster) {
    const s = statusOf(session, id, settings);
    if (s.kind === 'absent') counts.absent++;
    else counts.present++;
    if (s.kind === 'late') counts.late++;
  }
  return counts;
}

/** A session of today that was begun and not ended. */
export function inProgress(sessions: Session[], classId: string, today: LocalDate): Session | undefined {
  return sessions
    .filter((s) => s.classId === classId && s.localDate === today && !s.endedAt && (s.startedAt || isRecorded(s)))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
}
