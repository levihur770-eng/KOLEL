/** Screen D (part 1): the list of classes and of all students. */
import { useState } from 'react';
import { go } from '../components/nav';
import { Avatar, TopBar } from '../components/ui';
import { createClass } from '../data/actions';
import { useLive, useStore } from '../data/useStore';
import { byName } from '../logic/names';
import { t } from '../text/en';

export function People() {
  const store = useStore();
  const classes = useLive((s) => s.listClasses());
  const students = useLive((s) => s.listStudents());
  const photos = useLive((s) => s.listPhotos());
  const [showArchived, setShowArchived] = useState(false);

  if (!classes || !students) return <p className="muted pad">{t.loading}</p>;
  const photoOf = new Map((photos ?? []).map((p) => [p.studentId, p.jpegText]));
  const archivedCount = students.filter((s) => !s.active).length;
  const shown = students.filter((s) => s.active || showArchived).sort((a, b) => Number(b.active) - Number(a.active) || byName(a, b));

  return (
    <>
      <TopBar title={t.people.title} />
      <h3 className="section-title">{t.people.classes}</h3>
      <ul className="list">
        {[...classes].sort((a, b) => Number(a.archived) - Number(b.archived) || byName(a, b)).map((c) => (
          <li key={c.id}>
            <button className="list-row" onClick={() => go(`/class/${c.id}`)}>
              <span className="grow">
                <strong dir="auto">{c.name}</strong>
                {c.archived && <span className="chip">{t.people.archived}</span>}
                <br />
                <span className="muted small">{t.home.students(c.studentIds.length)}</span>
              </span>
              <span className="chevron" aria-hidden="true">
                {'›'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="pad">
        <button className="button" onClick={() => void createClass(store)}>
          {t.people.addClass}
        </button>
      </div>

      <h3 className="section-title">{t.people.students}</h3>
      {students.length === 0 && <p className="muted pad">{t.people.noStudents}</p>}
      <ul className="list">
        {shown.map((s) => (
          <li key={s.id}>
            <button className="list-row" onClick={() => go(`/student/${s.id}`)}>
              <Avatar name={s.name} photo={photoOf.get(s.id)} size={40} />
              <span className="grow" dir="auto">
                {s.name}
              </span>
              {!s.active && <span className="chip">{t.people.archived}</span>}
              <span className="chevron" aria-hidden="true">
                {'›'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {archivedCount > 0 && (
        <div className="pad">
          <button className="button quiet" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? t.people.hideArchived : t.people.showArchived(archivedCount)}
          </button>
        </div>
      )}
    </>
  );
}
