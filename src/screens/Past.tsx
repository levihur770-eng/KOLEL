/** Screen C: past sessions by date. Open one to correct it. */
import { useState } from 'react';
import { go, newId } from '../components/nav';
import { Sheet, TopBar } from '../components/ui';
import { useLive, useNow } from '../data/useStore';
import { countsOf } from '../logic/status';
import { formatDate, localDateOf, timeOf } from '../logic/time';
import { t } from '../text/en';

export function Past() {
  const classes = useLive((s) => s.listClasses());
  const sessions = useLive((s) => s.listSessions());
  const school = useLive((s) => s.getSchool());
  const today = localDateOf(new Date(useNow(60000)).toISOString());
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState(false);
  const [addClass, setAddClass] = useState('');
  const [addDate, setAddDate] = useState(today);

  if (!classes || !sessions || !school) return <p className="muted pad">{t.loading}</p>;
  const nameOf = new Map(classes.map((c) => [c.id, c.name]));
  const open = classes.filter((c) => !c.archived);
  const shown = sessions.filter((s) => !filter || s.classId === filter).sort((a, b) => b.localDate.localeCompare(a.localDate) || b.openedAt.localeCompare(a.openedAt));
  const chosenClass = addClass || open[0]?.id || '';

  return (
    <>
      <TopBar title={t.past.title} />
      <div className="pad stack">
        {classes.length > 1 && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">{t.past.allClasses}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {open.length > 0 && (
          <button className="button" onClick={() => setAdding(true)}>
            {t.past.addMissed}
          </button>
        )}
      </div>
      {shown.length === 0 && <p className="muted pad">{t.past.none}</p>}
      <ul className="list">
        {shown.map((s) => {
          const c = countsOf(s, school.settings);
          return (
            <li key={s.id}>
              <button className="list-row" onClick={() => go(`/register/${s.classId}/${s.id}`)}>
                <span className="grow">
                  <strong>{formatDate(s.localDate)}</strong>
                  <span className="muted" dir="auto">
                    {' · '}
                    {nameOf.get(s.classId) ?? t.past.unknownClass}
                  </span>
                  <br />
                  <span className="muted small">
                    {s.startedAt ? t.register.startedAt(timeOf(s.startedAt)) : t.register.notStarted}
                    {' · '}
                    {s.endedAt ? t.register.endedAt(timeOf(s.endedAt)) : t.register.notEnded}
                  </span>
                  <br />
                  {c.recorded ? (
                    <span>
                      {t.past.summary(c.present, c.roster)}
                      {c.late > 0 && ` · ${t.past.late(c.late)}`}
                    </span>
                  ) : (
                    <span className="chip">{t.past.notRecorded}</span>
                  )}
                </span>
                <span className="chevron" aria-hidden="true">
                  {'›'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {adding && (
        <Sheet title={t.past.addMissedTitle} sub={t.past.addMissedHint} onClose={() => setAdding(false)}>
          <div className="stack">
            <label className="field">
              <span>{t.past.class}</span>
              <select value={chosenClass} onChange={(e) => setAddClass(e.target.value)}>
                {open.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t.past.date}</span>
              <input type="date" value={addDate} max={today} onChange={(e) => setAddDate(e.target.value)} />
            </label>
            <button className="big-button" disabled={!chosenClass || !addDate} onClick={() => go(`/register/${chosenClass}/${newId()}/${addDate}`)}>
              {t.past.open}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
