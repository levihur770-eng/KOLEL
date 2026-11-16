/**
 * "Load example class": invented students and a few past sessions so the app
 * can be tried at once. Every id starts with "demo-", which is how
 * "Remove example data" finds them again.
 */
import { atLocalTime, addDays } from '../logic/time';
import { LOCAL_TEACHER_ID, type BackupData, type ClassGroup, type LocalDate, type Mark, type Session, type Student } from './types';

export const DEMO_PREFIX = 'demo-';
const NAMES = ['Avi Klein', 'Dovid Weiss', 'משה לוי', 'Yossi Farkas', 'Mendel Roth', 'שמואל כהן', 'Gabor Szabo', 'Eli Stern'];

/** Minutes after the start each student arrived, per session. null = not ticked, 'A' = absent, 'E' = excused, '?' = time unknown. */
type Cell = number | null | 'A' | 'E' | '?';
const PAST: { daysAgo: number; start: string; minutes: number; rows: Cell[]; endCheck?: number[] }[] = [
  { daysAgo: 14, start: '20:41', minutes: 62, rows: [-3, -1, 4, -2, 12, -5, 'A', -1] },
  { daysAgo: 12, start: '20:36', minutes: 71, rows: [-2, 6, -1, -4, 18, -3, -1, 'E'], endCheck: [4] },
  { daysAgo: 9, start: '20:52', minutes: 58, rows: [-6, -2, -3, null, 9, -1, 3, -4] },
  { daysAgo: 7, start: '', minutes: 0, rows: [] }, // register forgotten: "not recorded"
  { daysAgo: 5, start: '20:44', minutes: 66, rows: [-1, -3, '?', -2, 15, -2, 'A', -5] },
  { daysAgo: 2, start: '20:39', minutes: 75, rows: [-4, 2, -2, -1, 7, -3, -2, -1], endCheck: [1, 6] },
];

export function buildDemo(today: LocalDate): Pick<BackupData, 'students' | 'classes' | 'sessions'> {
  const students: Student[] = NAMES.map((name, i) => ({ id: `${DEMO_PREFIX}s${i + 1}`, name, active: true, joinedDate: addDays(today, -30) }));
  const ids = students.map((s) => s.id);
  const cls: ClassGroup = {
    id: `${DEMO_PREFIX}class`,
    name: 'Example class',
    teacherIds: [LOCAL_TEACHER_ID],
    studentIds: ids,
    usualStart: '20:30',
    usualLengthMinutes: 60,
    archived: false,
  };
  const sessions = PAST.map((p, n): Session => {
    const localDate = addDays(today, -p.daysAgo);
    const session: Session = {
      id: `${DEMO_PREFIX}session${n + 1}`,
      classId: cls.id,
      teacherId: LOCAL_TEACHER_ID,
      localDate,
      scheduledStart: cls.usualStart,
      openedAt: atLocalTime(localDate, p.start || '20:40'),
      endCheckTaken: !!p.endCheck,
      rosterIds: ids,
      marks: {},
    };
    if (!p.start) return session;
    const start = Date.parse(atLocalTime(localDate, p.start));
    session.openedAt = new Date(start - 8 * 60000).toISOString();
    session.startedAt = new Date(start).toISOString();
    session.endedAt = new Date(start + p.minutes * 60000).toISOString();
    p.rows.forEach((cell, i) => {
      if (cell === null) return;
      let mark: Mark;
      if (cell === 'A') mark = { absent: true };
      else if (cell === 'E') mark = { absent: true, excused: true, reason: 'Wedding' };
      else if (cell === '?') mark = { timeUnknown: true, editedAt: session.endedAt };
      else mark = { arrivedAt: new Date(start + cell * 60000 + 20000).toISOString() };
      if (p.endCheck && mark.absent !== true) mark.endPresent = !p.endCheck.includes(i);
      session.marks[ids[i]] = mark;
    });
    return session;
  });
  return { students, classes: [cls], sessions };
}

export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX);

/** Everything that is not example data. */
export function withoutDemo(data: BackupData): BackupData {
  return {
    school: data.school,
    students: data.students.filter((s) => !isDemoId(s.id)),
    photos: data.photos.filter((p) => !isDemoId(p.studentId)),
    classes: data.classes.filter((c) => !isDemoId(c.id)).map((c) => ({ ...c, studentIds: c.studentIds.filter((id) => !isDemoId(id)) })),
    sessions: data.sessions.filter((s) => !isDemoId(s.id) && !isDemoId(s.classId)),
  };
}
