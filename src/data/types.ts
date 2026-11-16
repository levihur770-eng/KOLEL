/**
 * The data, same shape in Stage 1 (this phone) and Stage 3 (school, Firestore).
 * RULE (P1): store facts only (moments, ticks). Never store a judgement such
 * as "late" or "absent 3 times"; those are computed in src/logic/.
 */

/** An exact moment, UTC, ISO 8601 text, e.g. "2026-11-16T19:47:03.000Z". */
export type Iso = string;
/** A calendar day in Europe/Budapest, e.g. "2026-11-16". */
export type LocalDate = string;

export interface SchoolSettings {
  /** Minutes after the start during which an arrival still counts as on time. */
  graceMinutes: number;
  teachersMayCreateClasses: boolean;
  teachersMayAddStudents: boolean;
  lateReference: 'actualStart';
}

export interface School {
  id: string;
  name: string;
  settings: SchoolSettings;
}

export interface Student {
  id: string;
  name: string;
  /** false = archived (hidden from registers, kept in old sessions). */
  active: boolean;
  joinedDate: LocalDate;
  note?: string;
}

/** Kept apart from the student so lists load fast. jpegText is a small "data:image/jpeg..." text. */
export interface Photo {
  studentId: string;
  jpegText: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  teacherIds: string[];
  studentIds: string[];
  /** "20:30" */
  usualStart?: string;
  usualLengthMinutes?: number;
  archived: boolean;
}

export interface Mark {
  /** Moment the student was ticked present. */
  arrivedAt?: Iso;
  /** true = present, but ticked afterwards ("I forgot, he was there"). */
  timeUnknown?: boolean;
  /** true = explicitly marked absent. */
  absent?: boolean;
  /** Absence or lateness excused. */
  excused?: boolean;
  reason?: string;
  /** Left early. */
  leftAt?: Iso;
  /** Only meaningful if the session's endCheckTaken is true. */
  endPresent?: boolean;
  /** Set when the mark was corrected afterwards or a time was typed by hand. */
  editedAt?: Iso;
}

export interface Session {
  id: string;
  classId: string;
  teacherId: string;
  localDate: LocalDate;
  /** Copied from class.usualStart. */
  scheduledStart?: string;
  /** When the register screen was opened. */
  openedAt: Iso;
  /** When "Start class" was pressed. May be absent. */
  startedAt?: Iso;
  /** When "End class" was pressed. */
  endedAt?: Iso;
  /** true only if the end-of-class register was done. */
  endCheckTaken: boolean;
  /**
   * Who was on the class list for this session (a fact, added to the brief's
   * shape): kept up to date while the class runs, frozen once it has ended.
   * Without it, a student added to the class later would look absent in old
   * sessions, and an archived student's absences would vanish.
   */
  rosterIds: string[];
  marks: Record<string, Mark>;
  note?: string;
}

/** Everything in the app; also the content of a backup file. */
export interface BackupData {
  school: School;
  students: Student[];
  photos: Photo[];
  classes: ClassGroup[];
  sessions: Session[];
}

/** Stage 1-2: one teacher on one device. */
export const LOCAL_TEACHER_ID = 'local';

export const DEFAULT_SCHOOL: School = {
  id: 'local',
  name: 'My Kolel',
  settings: { graceMinutes: 0, teachersMayCreateClasses: true, teachersMayAddStudents: true, lateReference: 'actualStart' },
};
