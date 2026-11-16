/** Screen A: my classes, each with a big "Take register" button. */
import { go, newId } from '../components/nav';
import { TopBar } from '../components/ui';
import { createClass, loadExample } from '../data/actions';
import { useLive, useNow, useStore } from '../data/useStore';
import type { ClassGroup } from '../data/types';
import { activeRoster } from '../logic/marks';
import { inProgress } from '../logic/status';
import { localDateOf, timeOf } from '../logic/time';
import { t } from '../text/en';

export function Home() {
  const store = useStore();
  const classes = useLive((s) => s.listClasses());
  const students = useLive((s) => s.listStudents());
  const sessions = useLive((s) => s.listSessions());
  const today = localDateOf(new Date(useNow(30000)).toISOString());

  if (!classes || !students || !sessions) return <p className="muted pad">{t.loading}</p>;
  const shown = classes.filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name));

  const card = (cls: ClassGroup) => {
    const running = inProgress(sessions, cls.id, today);
    const count = activeRoster(cls, students).length;
    return (
      <section className="card class-card" key={cls.id}>
        <h2 dir="auto">{cls.name}</h2>
        <p className="muted">
          {cls.usualStart ? `${t.home.usually(cls.usualStart)} · ` : ''}
          {count ? t.home.students(count) : t.home.noStudents}
        </p>
        {running && <p className="running">{running.startedAt ? t.home.inProgressSince(timeOf(running.startedAt)) : t.home.registerOpenSince(timeOf(running.openedAt))}</p>}
        <button className="big-button" onClick={() => go(`/register/${cls.id}/${running?.id ?? newId()}`)}>
          {running ? t.home.continue : t.home.takeRegister}
        </button>
      </section>
    );
  };

  return (
    <>
      <TopBar title={t.appName} />
      {shown.length === 0 ? (
        <section className="card empty">
          <h2>{t.home.noClasses}</h2>
          <p className="muted">{t.home.noClassesHint}</p>
          <button className="big-button" onClick={() => void createClass(store)}>
            {t.home.addClass}
          </button>
          <button className="button" onClick={() => void loadExample(store, today)}>
            {t.home.loadExample}
          </button>
        </section>
      ) : (
        shown.map(card)
      )}
    </>
  );
}
