/**
 * The backup file (.json): everything in the app, in the same shape as it is
 * stored. `readBackup` checks a file before it may replace the stored data.
 */
import { DEFAULT_SCHOOL, type BackupData, type Session } from './types';

export const BACKUP_APP = 'kolel-register';
export const BACKUP_FORMAT = 1;

export function makeBackup(data: BackupData, exportedAt: string): string {
  return JSON.stringify({ app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt, ...data }, null, 1);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isList = (v: unknown, check: (item: Record<string, unknown>) => boolean) => Array.isArray(v) && v.every((i) => isObject(i) && check(i));
const text = (v: unknown) => typeof v === 'string' && v.length > 0;

/** Returns the data in the file, or throws an Error if it is not a usable backup. */
export function readBackup(fileText: string): BackupData {
  let raw: unknown;
  try {
    raw = JSON.parse(fileText);
  } catch {
    throw new Error('not-json');
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP) throw new Error('not-a-backup');
  if (typeof raw.format !== 'number' || raw.format > BACKUP_FORMAT) throw new Error('newer-format');
  const ok =
    isList(raw.students, (s) => text(s.id) && typeof s.name === 'string') &&
    isList(raw.photos, (p) => text(p.studentId) && text(p.jpegText)) &&
    isList(raw.classes, (c) => text(c.id) && Array.isArray(c.studentIds)) &&
    isList(raw.sessions, (s) => text(s.id) && text(s.classId) && text(s.localDate) && isObject(s.marks));
  if (!ok) throw new Error('damaged');
  const school = isObject(raw.school) && isObject(raw.school.settings) ? (raw.school as unknown as BackupData['school']) : DEFAULT_SCHOOL;
  const data = raw as unknown as BackupData;
  return {
    school: { ...DEFAULT_SCHOOL, ...school, settings: { ...DEFAULT_SCHOOL.settings, ...school.settings } },
    students: data.students,
    photos: data.photos,
    classes: data.classes,
    sessions: data.sessions.map((s): Session => ({ ...s, endCheckTaken: !!s.endCheckTaken, rosterIds: Array.isArray(s.rosterIds) ? s.rosterIds : [] })),
  };
}
