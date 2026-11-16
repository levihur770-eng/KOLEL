/**
 * The Store kept in the phone's own browser storage (IndexedDB). Works with
 * no internet. Used in Stages 1-2.
 */
import type { Store } from './store';
import { DEFAULT_SCHOOL, type BackupData, type ClassGroup, type Photo, type School, type Session, type Student } from './types';

const DB_NAME = 'kolel-register';
const TABLES = ['meta', 'students', 'photos', 'classes', 'sessions'] as const;
type Table = (typeof TABLES)[number];

function open(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('meta');
      db.createObjectStore('students', { keyPath: 'id' });
      db.createObjectStore('photos', { keyPath: 'studentId' });
      db.createObjectStore('classes', { keyPath: 'id' });
      db.createObjectStore('sessions', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function createIdbStore(factory: IDBFactory = indexedDB): Store {
  const db = open(factory);
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((l) => l());

  /** Runs `work` in one transaction; resolves when everything is safely written. */
  async function run<T>(tables: Table[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => IDBRequest<T> | void): Promise<T> {
    const tx = (await db).transaction(tables, mode);
    return new Promise<T>((resolve, reject) => {
      const req = work(tx);
      tx.oncomplete = () => resolve(req ? req.result : (undefined as T));
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  const all = <T>(table: Table) => run<T[]>([table], 'readonly', (tx) => tx.objectStore(table).getAll());
  const write = async (tables: Table[], work: (tx: IDBTransaction) => void) => {
    await run(tables, 'readwrite', work);
    changed();
  };

  return {
    async getSchool() {
      const school = await run<School | undefined>(['meta'], 'readonly', (tx) => tx.objectStore('meta').get('school'));
      return school ?? DEFAULT_SCHOOL;
    },
    saveSchool: (school) => write(['meta'], (tx) => void tx.objectStore('meta').put(school, 'school')),

    listStudents: () => all<Student>('students'),
    saveStudents: (students) => write(['students'], (tx) => students.forEach((s) => tx.objectStore('students').put(s))),

    listPhotos: () => all<Photo>('photos'),
    savePhoto: (photo) => write(['photos'], (tx) => void tx.objectStore('photos').put(photo)),
    deletePhoto: (studentId) => write(['photos'], (tx) => void tx.objectStore('photos').delete(studentId)),

    listClasses: () => all<ClassGroup>('classes'),
    saveClass: (cls) => write(['classes'], (tx) => void tx.objectStore('classes').put(cls)),

    listSessions: () => all<Session>('sessions'),
    getSession: (id) => run<Session | undefined>(['sessions'], 'readonly', (tx) => tx.objectStore('sessions').get(id)),
    saveSession: (session) => write(['sessions'], (tx) => void tx.objectStore('sessions').put(session)),
    deleteSession: (id) => write(['sessions'], (tx) => void tx.objectStore('sessions').delete(id)),

    async exportAll(): Promise<BackupData> {
      const [school, students, photos, classes, sessions] = await Promise.all([
        this.getSchool(),
        this.listStudents(),
        this.listPhotos(),
        this.listClasses(),
        this.listSessions(),
      ]);
      return { school, students, photos, classes, sessions };
    },
    replaceAll: (data) =>
      write([...TABLES], (tx) => {
        for (const t of TABLES) tx.objectStore(t).clear();
        tx.objectStore('meta').put(data.school, 'school');
        data.students.forEach((s) => tx.objectStore('students').put(s));
        data.photos.forEach((p) => tx.objectStore('photos').put(p));
        data.classes.forEach((c) => tx.objectStore('classes').put(c));
        data.sessions.forEach((s) => tx.objectStore('sessions').put(s));
      }),

    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
