/** Things more than one screen does to the store. */
import { go, newId } from '../components/nav';
import { t } from '../text/en';
import { buildDemo } from './demo';
import type { Store } from './store';
import { LOCAL_TEACHER_ID, type ClassGroup, type LocalDate } from './types';

/** Makes an empty class and opens it for editing. */
export async function createClass(store: Store): Promise<void> {
  const cls: ClassGroup = { id: newId(), name: t.people.newClassName, teacherIds: [LOCAL_TEACHER_ID], studentIds: [], archived: false };
  await store.saveClass(cls);
  go(`/class/${cls.id}`);
}

/** Adds the example class with its students and past sessions. */
export async function loadExample(store: Store, today: LocalDate): Promise<void> {
  const demo = buildDemo(today);
  await store.saveStudents(demo.students);
  for (const c of demo.classes) await store.saveClass(c);
  for (const s of demo.sessions) await store.saveSession(s);
}
