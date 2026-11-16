import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { countsOf } from '../logic/status';
import { makeBackup, readBackup } from './backup';
import { buildDemo, withoutDemo } from './demo';
import { createIdbStore } from './idbStore';
import { DEFAULT_SCHOOL, type BackupData, type Session } from './types';

const session: Session = { id: 's1', classId: 'c1', teacherId: 'local', localDate: '2026-11-16', openedAt: '2026-11-16T19:40:00.000Z', endCheckTaken: false, rosterIds: ['a'], marks: { a: { arrivedAt: '2026-11-16T19:41:00.000Z' } } };
const data: BackupData = {
  school: { ...DEFAULT_SCHOOL, settings: { ...DEFAULT_SCHOOL.settings, graceMinutes: 3 } },
  students: [{ id: 'a', name: 'משה לוי', active: true, joinedDate: '2026-11-01' }],
  photos: [{ studentId: 'a', jpegText: 'data:image/jpeg;base64,AAAA' }],
  classes: [{ id: 'c1', name: 'Class', teacherIds: ['local'], studentIds: ['a'], archived: false }],
  sessions: [session],
};

describe('the store on this phone (IndexedDB)', () => {
  it('starts empty with the default settings', async () => {
    const store = createIdbStore(new IDBFactory());
    expect(await store.getSchool()).toEqual(DEFAULT_SCHOOL);
    expect(await store.listSessions()).toEqual([]);
  });

  it('keeps what is saved, also after the app is opened again', async () => {
    const factory = new IDBFactory();
    const store = createIdbStore(factory);
    await store.saveStudents(data.students);
    await store.savePhoto(data.photos[0]);
    await store.saveClass(data.classes[0]);
    await store.saveSession(session);
    await store.saveSchool(data.school);
    const reopened = createIdbStore(factory);
    expect(await reopened.exportAll()).toEqual(data);
    expect(await reopened.getSession('s1')).toEqual(session);
    expect(await reopened.getSession('nope')).toBeUndefined();
  });

  it('saving a session again replaces it (one record per session)', async () => {
    const store = createIdbStore(new IDBFactory());
    await store.saveSession(session);
    await store.saveSession({ ...session, endedAt: '2026-11-16T21:00:00.000Z' });
    expect(await store.listSessions()).toHaveLength(1);
    await store.deleteSession('s1');
    expect(await store.listSessions()).toEqual([]);
  });

  it('tells listeners after every change, and stops when asked', async () => {
    const store = createIdbStore(new IDBFactory());
    let calls = 0;
    const stop = store.subscribe(() => calls++);
    await store.saveSession(session);
    await store.deletePhoto('a');
    expect(calls).toBe(2);
    stop();
    await store.saveSession(session);
    expect(calls).toBe(2);
  });

  it('replaceAll throws away the old content', async () => {
    const store = createIdbStore(new IDBFactory());
    await store.saveSession({ ...session, id: 'old' });
    await store.replaceAll(data);
    expect(await store.exportAll()).toEqual(data);
  });
});

describe('the backup file', () => {
  it('comes back exactly as it was saved', () => {
    expect(readBackup(makeBackup(data, '2026-11-16T20:00:00.000Z'))).toEqual(data);
  });
  it('refuses files that are not a backup, damaged, or from a newer version', () => {
    expect(() => readBackup('hello')).toThrow('not-json');
    expect(() => readBackup('{"students":[]}')).toThrow('not-a-backup');
    expect(() => readBackup(JSON.stringify({ app: 'kolel-register', format: 1, students: [{}], photos: [], classes: [], sessions: [] }))).toThrow('damaged');
    expect(() => readBackup(JSON.stringify({ app: 'kolel-register', format: 99, students: [], photos: [], classes: [], sessions: [] }))).toThrow('newer-format');
  });
});

describe('the example class', () => {
  const demo = buildDemo('2026-11-16');
  it('has students with Hebrew and Latin names and sessions on past days only', () => {
    expect(demo.students.length).toBe(8);
    expect(demo.sessions.every((s) => s.localDate < '2026-11-16')).toBe(true);
  });
  it('includes a forgotten register, which is "not recorded"', () => {
    expect(demo.sessions.filter((s) => !countsOf(s, { graceMinutes: 0 }).recorded)).toHaveLength(1);
  });
  it('can be removed again without touching real data', () => {
    const mixed: BackupData = { ...data, students: [...data.students, ...demo.students], classes: [...data.classes, ...demo.classes], sessions: [...data.sessions, ...demo.sessions] };
    expect(withoutDemo(mixed)).toEqual(data);
  });
});
