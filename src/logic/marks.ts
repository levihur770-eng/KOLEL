/**
 * Every change a teacher can make to a session, as pure functions:
 * (old session, ...) -> new session. The screens call these and save the
 * result; nothing else changes a session.
 *
 * `stamp` = the moment of a correction. Pass it when a finished or older
 * session is being corrected, or a time is typed by hand; it becomes
 * mark.editedAt. Leave it out for normal ticking during class.
 */
import type { ClassGroup, Iso, LocalDate, Mark, Session, Student } from '../data/types';
import { LOCAL_TEACHER_ID } from '../data/types';
import { isPresent } from './status';
import { localDateOf } from './time';

/** Drops empty fields so saved records stay small and clean. */
function clean(mark: Mark): Mark {
  const out: Mark = {};
  if (mark.arrivedAt) out.arrivedAt = mark.arrivedAt;
  if (mark.timeUnknown) out.timeUnknown = true;
  if (mark.absent) out.absent = true;
  if (mark.excused) out.excused = true;
  if (mark.excused && mark.reason?.trim()) out.reason = mark.reason.trim();
  if (mark.leftAt) out.leftAt = mark.leftAt;
  if (mark.endPresent !== undefined) out.endPresent = mark.endPresent;
  if (mark.editedAt) out.editedAt = mark.editedAt;
  return out;
}

function withMark(session: Session, studentId: string, mark: Mark, stamp?: Iso): Session {
  const next = clean(stamp ? { ...mark, editedAt: stamp } : mark);
  return { ...session, marks: { ...session.marks, [studentId]: next } };
}

/** The students expected in a class today: on its list and not archived. */
export function activeRoster(cls: ClassGroup, students: Student[]): string[] {
  const active = new Set(students.filter((s) => s.active).map((s) => s.id));
  return cls.studentIds.filter((id) => active.has(id));
}

export function newSession(args: { id: string; cls: ClassGroup; rosterIds: string[]; now: Iso; localDate?: LocalDate }): Session {
  const session: Session = {
    id: args.id,
    classId: args.cls.id,
    teacherId: LOCAL_TEACHER_ID,
    localDate: args.localDate ?? localDateOf(args.now),
    openedAt: args.now,
    endCheckTaken: false,
    rosterIds: args.rosterIds,
    marks: {},
  };
  if (args.cls.usualStart) session.scheduledStart = args.cls.usualStart;
  return session;
}

/** Tick present now. In a correction the real time is not known. */
export function tickPresent(session: Session, studentId: string, now: Iso, correction: boolean): Session {
  return correction ? withMark(session, studentId, { timeUnknown: true }, now) : withMark(session, studentId, { arrivedAt: now });
}

/** Present, with an arrival time typed by hand. */
export function setArrival(session: Session, studentId: string, arrivedAt: Iso, stamp: Iso): Session {
  const old = session.marks[studentId] ?? {};
  return withMark(session, studentId, { ...old, absent: false, timeUnknown: false, arrivedAt }, stamp);
}

/** Present, time not known. */
export function setTimeUnknown(session: Session, studentId: string, stamp: Iso): Session {
  const old = session.marks[studentId] ?? {};
  return withMark(session, studentId, { ...old, absent: false, arrivedAt: undefined, timeUnknown: true }, stamp);
}

export function setAbsent(session: Session, studentId: string, stamp?: Iso): Session {
  const old = session.marks[studentId] ?? {};
  return withMark(session, studentId, { absent: true, excused: old.excused, reason: old.reason }, stamp);
}

/** Excuses an absence or a lateness. A student with no mark becomes "absent, excused". */
export function setExcused(session: Session, studentId: string, excused: boolean, reason: string | undefined, stamp?: Iso): Session {
  const old = session.marks[studentId];
  if (!old) return excused ? withMark(session, studentId, { absent: true, excused: true, reason }, stamp) : session;
  return withMark(session, studentId, { ...old, excused, reason }, stamp);
}

/** Left early at `leftAt`; undefined removes it. Only for a present student. */
export function setLeft(session: Session, studentId: string, leftAt: Iso | undefined, stamp?: Iso): Session {
  const old = session.marks[studentId];
  if (!old || !isPresent(old)) return session;
  return withMark(session, studentId, { ...old, leftAt }, stamp);
}

/** Undo: back to "not ticked". */
export function clearMark(session: Session, studentId: string): Session {
  const marks = { ...session.marks };
  delete marks[studentId];
  return { ...session, marks };
}

/** Ticks everyone who has no mark yet. */
export function everyoneHere(session: Session, studentIds: string[], now: Iso, correction: boolean): Session {
  let next = session;
  for (const id of studentIds) if (!next.marks[id]) next = tickPresent(next, id, now, correction);
  return next;
}

/** "Start class" pressed, or the start time changed by hand; undefined removes it. */
export function setStart(session: Session, startedAt: Iso | undefined): Session {
  const next: Session = { ...session, startedAt };
  if (!startedAt) delete next.startedAt;
  return next;
}

/** "End class" pressed, or the end time changed by hand; undefined reopens the class. */
export function setEnd(session: Session, endedAt: Iso | undefined): Session {
  const next: Session = { ...session, endedAt };
  if (!endedAt) delete next.endedAt;
  return next;
}

/** The end-of-class register: who of the present students is still there. */
export function saveEndCheck(session: Session, stillHereIds: string[]): Session {
  const marks: Record<string, Mark> = {};
  for (const [id, mark] of Object.entries(session.marks)) {
    marks[id] = isPresent(mark) ? { ...mark, endPresent: stillHereIds.includes(id) } : mark;
  }
  return { ...session, endCheckTaken: true, marks };
}

/** Removes the end-of-class register: as if it was never taken. */
export function clearEndCheck(session: Session): Session {
  const marks: Record<string, Mark> = {};
  for (const [id, mark] of Object.entries(session.marks)) {
    const { endPresent: _dropped, ...rest } = mark;
    marks[id] = rest;
  }
  return { ...session, endCheckTaken: false, marks };
}

export function setNote(session: Session, note: string): Session {
  if ((session.note ?? '') === note.trim()) return session;
  const next: Session = { ...session, note: note.trim() };
  if (!next.note) delete next.note;
  return next;
}

export function setRoster(session: Session, rosterIds: string[]): Session {
  return { ...session, rosterIds };
}
