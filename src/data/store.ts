/**
 * THE storage interface. Screens only ever talk to this; they never touch
 * IndexedDB (or, from Stage 3, Firestore) directly. Stage 1 implements it in
 * idbStore.ts; Stage 3 adds a Firestore implementation with the same methods.
 */
import type { BackupData, ClassGroup, Photo, School, Session, Student } from './types';

export interface Store {
  getSchool(): Promise<School>;
  saveSchool(school: School): Promise<void>;

  listStudents(): Promise<Student[]>;
  saveStudents(students: Student[]): Promise<void>;

  listPhotos(): Promise<Photo[]>;
  savePhoto(photo: Photo): Promise<void>;
  deletePhoto(studentId: string): Promise<void>;

  listClasses(): Promise<ClassGroup[]>;
  saveClass(cls: ClassGroup): Promise<void>;

  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  /** One session is one record holding all its marks. */
  saveSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;

  /** Everything, for a backup file. */
  exportAll(): Promise<BackupData>;
  /** Throws away everything stored and puts `data` in its place. */
  replaceAll(data: BackupData): Promise<void>;

  /** `listener` is called after every change. Returns a function that stops it. */
  subscribe(listener: () => void): () => void;
}
