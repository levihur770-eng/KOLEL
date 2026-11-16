/** Screen D (part 2): one class - its name, usual time, and its students. */
import { useState } from 'react';
import { go, newId } from '../components/nav';
import { Avatar, Sheet, TopBar } from '../components/ui';
import type { ClassGroup, Student } from '../data/types';
import { useLive, useNow, useStore } from '../data/useStore';
import { byName, parseNameList } from '../logic/names';
import { localDateOf } from '../logic/time';
import { t } from '../text/en';

export function ClassEdit({ classId }: { classId: string }) {
  const store = useStore();
  const classes = useLive((s) => s.listClasses());
  const students = useLive((s) => s.listStudents());
  const photos = useLive((s) => s.listPhotos());
  const today = localDateOf(new Date(useNow(60000)).toISOString());
  const [newName, setNewName] = useState('');
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [picking, setPicking] = useState(false);

  if (!classes || !students) return <p className="muted pad">{t.loading}</p>;
  const cls = classes.find((c) => c.id === classId);
  if (!cls) {
    return (
      <>
        <TopBar title={t.people.classTitle} back="/people" />
        <p className="muted pad">{t.people.gone}</p>
      </>
    );
  }
  const p = t.people;
  const photoOf = new Map((photos ?? []).map((x) => [x.studentId, x.jpegText]));
  const byId = new Map(students.map((s) => [s.id, s]));
  const members = cls.studentIds.map((id) => byId.get(id)).filter((s): s is Student => !!s).sort(byName);
  const others = students.filter((s) => s.active && !cls.studentIds.includes(s.id)).sort(byName);
  const save = (change: Partial<ClassGroup>) => void store.saveClass({ ...cls, ...change });

  const addNames = async (names: string[]) => {
    if (names.length === 0) return;
    const added: Student[] = names.map((name) => ({ id: newId(), name, active: true, joinedDate: today }));
    await store.saveStudents(added);
    await store.saveClass({ ...cls, studentIds: [...cls.studentIds, ...added.map((s) => s.id)] });
  };
  const pastedNames = parseNameList(pasted);

  return (
    <>
      <TopBar title={cls.name} sub={p.classTitle} back="/people" />
      <div className="pad stack">
        <label className="field">
          <span>{p.className}</span>
          <input key={cls.id} type="text" dir="auto" defaultValue={cls.name} onBlur={(e) => e.target.value.trim() && save({ name: e.target.value.trim() })} />
        </label>
        <label className="field">
          <span>{p.usualStart}</span>
          <input type="time" defaultValue={cls.usualStart ?? ''} onBlur={(e) => save({ usualStart: e.target.value || undefined })} />
        </label>
        <label className="field">
          <span>{p.usualLength}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            defaultValue={cls.usualLengthMinutes ?? ''}
            onBlur={(e) => save({ usualLengthMinutes: Number(e.target.value) > 0 ? Math.round(Number(e.target.value)) : undefined })}
          />
          <small className="muted">{p.usualLengthHint}</small>
        </label>
      </div>

      <h3 className="section-title">{p.inClass(members.length)}</h3>
      <ul className="list">
        {members.map((s) => (
          <li key={s.id} className="list-row">
            <button className="row-main" onClick={() => go(`/student/${s.id}/${cls.id}`)}>
              <Avatar name={s.name} photo={photoOf.get(s.id)} size={40} />
              <span className="grow" dir="auto">
                {s.name}
              </span>
              {!s.active && <span className="chip">{p.archived}</span>}
            </button>
            <button className="icon-button" aria-label={p.removeFromClass} title={p.removeFromClass} onClick={() => save({ studentIds: cls.studentIds.filter((id) => id !== s.id) })}>
              {'×'}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="pad row"
        onSubmit={(e) => {
          e.preventDefault();
          void addNames(parseNameList(newName)).then(() => setNewName(''));
        }}
      >
        <input className="grow" type="text" dir="auto" placeholder={p.addStudentPlaceholder} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="button" disabled={!newName.trim()}>
          {p.add}
        </button>
      </form>
      <div className="pad stack">
        <button className="button" onClick={() => setPasting(true)}>
          {p.pasteList}
        </button>
        {others.length > 0 && (
          <button className="button" onClick={() => setPicking(true)}>
            {p.addExisting}
          </button>
        )}
        <button className="button quiet" onClick={() => save({ archived: !cls.archived })}>
          {cls.archived ? p.restoreClass : p.archiveClass}
        </button>
        <small className="muted">{p.archiveClassHint}</small>
      </div>

      {pasting && (
        <Sheet title={p.pasteList} sub={p.pasteHint} onClose={() => setPasting(false)}>
          <div className="stack">
            <textarea dir="auto" rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} autoFocus />
            <button
              className="big-button"
              disabled={pastedNames.length === 0}
              onClick={() =>
                void addNames(pastedNames).then(() => {
                  setPasted('');
                  setPasting(false);
                })
              }
            >
              {p.pasteAdd(pastedNames.length)}
            </button>
          </div>
        </Sheet>
      )}
      {picking && (
        <Sheet title={p.addExisting} onClose={() => setPicking(false)}>
          <ul className="list">
            {others.map((s) => (
              <li key={s.id}>
                <button className="list-row" onClick={() => save({ studentIds: [...cls.studentIds, s.id] })}>
                  <Avatar name={s.name} photo={photoOf.get(s.id)} size={40} />
                  <span className="grow" dir="auto">
                    {s.name}
                  </span>
                  <span aria-hidden="true">+</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="big-button" onClick={() => setPicking(false)}>
            {t.done}
          </button>
        </Sheet>
      )}
    </>
  );
}
