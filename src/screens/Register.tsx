/**
 * Screen B, the main screen: take the register of one session.
 * Also used to correct a past session (screen C): "correction" mode.
 *
 * live       = the session is of today and not ended: a tap stamps the time now.
 * correction = any other session: a tap means "present, time not known", and
 *              every change is stamped with editedAt.
 *
 * The session is saved after every single change (one record, all marks).
 * A session that was only looked at (no tick, no Start) is never saved.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { go } from '../components/nav';
import { Avatar, Sheet, TopBar } from '../components/ui';
import type { Photo, SchoolSettings, Session, Student } from '../data/types';
import { useLive, useNow, useStore } from '../data/useStore';
import * as marks from '../logic/marks';
import { byName } from '../logic/names';
import { countsOf, isPresent, rosterOf, statusOf, type Status } from '../logic/status';
import { atLocalTime, formatDate, formatDuration, localDateOf, timeOf } from '../logic/time';
import { t } from '../text/en';
import { statusText } from './statusText';

const nowIso = () => new Date().toISOString();

function tileClass(status: Status, live: boolean): string {
  if (status.kind === 'late') return 'tile tile-late';
  if (status.kind === 'absent') return status.explicit || !live ? (status.explicit ? 'tile tile-absent' : 'tile tile-missing') : 'tile';
  if (status.kind === 'notRecorded') return 'tile';
  return 'tile tile-here';
}

export function Register({ classId, sessionId, date }: { classId: string; sessionId: string; date?: string }) {
  const store = useStore();
  const classes = useLive((s) => s.listClasses());
  const students = useLive((s) => s.listStudents());
  const photos = useLive((s) => s.listPhotos());
  const school = useLive((s) => s.getSchool());
  const now = useNow(1000);

  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<Session | null>(null);
  const saved = useRef(false); // is this session in the store yet?
  const [saveFailed, setSaveFailed] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'none' | 'end' | 'endCheck' | 'times'>('none');
  const [ending, setEnding] = useState(false); // "End class" was just pressed: go home afterwards

  const cls = classes?.find((c) => c.id === classId);

  // Load the session, or prepare a new one (not saved until something happens).
  useEffect(() => {
    if (!classes || !students || current.current) return;
    let stopped = false;
    void store.getSession(sessionId).then((found) => {
      if (stopped || current.current) return;
      const fresh = cls ? marks.newSession({ id: sessionId, cls, rosterIds: marks.activeRoster(cls, students), now: nowIso(), localDate: date }) : null;
      saved.current = !!found;
      current.current = found ?? fresh;
      setSession(current.current);
    });
    return () => {
      stopped = true;
    };
  }, [classes, students, cls, store, sessionId, date]);

  const update = (change: (s: Session) => Session) => {
    if (!current.current) return;
    const next = change(current.current);
    if (next === current.current) return;
    current.current = next;
    saved.current = true;
    setSession(next);
    store.saveSession(next).then(
      () => setSaveFailed(false),
      () => setSaveFailed(true),
    );
  };

  const today = localDateOf(new Date(now).toISOString());
  const live = !!session && !session.endedAt && session.localDate === today;

  // While the class runs, the session's list follows the class list.
  useEffect(() => {
    if (!live || !cls || !students || !current.current) return;
    const expected = marks.activeRoster(cls, students);
    if (expected.join() === current.current.rosterIds.join()) return;
    current.current = marks.setRoster(current.current, expected);
    setSession(current.current);
    if (saved.current) void store.saveSession(current.current);
  }, [live, cls, students, store]);

  if (!classes || !students || !school || !session) {
    if (classes && !cls && students) return <Missing />;
    return <p className="muted pad">{t.loading}</p>;
  }

  const settings = school.settings;
  const photoOf = new Map((photos ?? []).map((p: Photo) => [p.studentId, p.jpegText]));
  const byId = new Map(students.map((s) => [s.id, s]));
  const roster = rosterOf(session)
    .map((id) => byId.get(id))
    .filter((s): s is Student => !!s)
    .sort(byName);
  // Correcting: students of the class who were not on the list that day can still be ticked.
  const extra = live || !cls ? [] : marks.activeRoster(cls, students).filter((id) => !roster.some((s) => s.id === id)).map((id) => byId.get(id)!).sort(byName);
  const counts = countsOf(session, settings);
  const correction = !live;

  const tap = (id: string) => {
    if (session.marks[id]) setMenuFor(id);
    else update((s) => marks.tickPresent(s, id, nowIso(), correction));
  };

  const tile = (student: Student) => {
    const mark = session.marks[student.id];
    const status = statusOf(session, student.id, settings);
    const words = statusText(status, mark, live);
    return (
      <button
        key={student.id}
        className={tileClass(status, live)}
        onClick={() => tap(student.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuFor(student.id);
        }}
      >
        <Avatar name={student.name} photo={photoOf.get(student.id)} size={64} />
        <span className="tile-name" dir="auto">
          {student.name}
        </span>
        <span className="tile-status">{words.join(' · ') || ' '}</span>
      </button>
    );
  };

  const elapsed = session.startedAt ? now - Date.parse(session.startedAt) : 0;
  const lengthMs = (cls?.usualLengthMinutes ?? 0) * 60000;
  const over = live && lengthMs > 0 && elapsed > lengthMs;
  const menuStudent = menuFor ? byId.get(menuFor) : undefined;

  return (
    <div className="register">
      <TopBar
        title={cls?.name ?? t.past.unknownClass}
        sub={correction ? `${t.register.correcting} · ${formatDate(session.localDate)}` : formatDate(session.localDate)}
        back={correction ? '/past' : '/'}
      />
      {saveFailed && <p className="error pad">{t.saveFailed}</p>}

      {live && !session.startedAt && (
        <div className="start-area">
          <button className="start-button" onClick={() => update((s) => marks.setStart(s, nowIso()))}>
            {t.register.start}
          </button>
          <p className="muted small">{t.register.startHint}</p>
        </div>
      )}
      {live && session.startedAt && (
        <button className={over ? 'clock clock-over' : 'clock'} onClick={() => setSheet('times')}>
          <strong>{t.register.started(timeOf(session.startedAt), formatDuration(elapsed))}</strong>
          <span>{over ? t.register.overTime(formatDuration(elapsed - lengthMs)) : t.register.changeStart}</span>
        </button>
      )}
      {correction && (
        <button className="clock clock-past" onClick={() => setSheet('times')}>
          <strong>
            {session.startedAt ? t.register.startedAt(timeOf(session.startedAt)) : t.register.notStarted}
            {' · '}
            {session.endedAt ? t.register.endedAt(timeOf(session.endedAt)) : t.register.notEnded}
          </strong>
          <span>{t.register.classTimes}</span>
        </button>
      )}

      <div className="count-row">
        <span>
          {t.register.hereCount(counts.present, counts.roster)}
          {counts.late > 0 && ` · ${t.register.lateCount(counts.late)}`}
        </span>
        <button
          className="button small-button"
          disabled={roster.every((s) => session.marks[s.id])}
          onClick={() =>
            update((s) =>
              marks.everyoneHere(
                s,
                roster.map((x) => x.id),
                nowIso(),
                correction,
              ),
            )
          }
        >
          {t.register.everyoneHere}
        </button>
      </div>

      {roster.length === 0 && extra.length === 0 && <p className="muted pad">{t.register.noOne}</p>}
      <div className="grid">{roster.map(tile)}</div>
      {extra.length > 0 && (
        <>
          <h3 className="section-title">{t.register.notOnList}</h3>
          <div className="grid">{extra.map(tile)}</div>
        </>
      )}

      <div className="bottom-bar">
        {live ? (
          <button className="big-button end-button" onClick={() => setSheet('end')}>
            {t.register.endClass}
          </button>
        ) : (
          <button className="big-button" onClick={() => go('/past')}>
            {t.done}
          </button>
        )}
      </div>

      {menuStudent && (
        <StudentMenu
          session={session}
          student={menuStudent}
          settings={settings}
          live={live}
          apply={(change) => {
            update(change);
            setMenuFor(null);
          }}
          onClose={() => setMenuFor(null)}
        />
      )}

      {sheet === 'end' && (
        <Sheet title={t.register.end.title} onClose={() => setSheet('none')}>
          <div className="stack">
            <button
              className="big-button"
              onClick={() => {
                update((s) => marks.setEnd(s, nowIso()));
                setEnding(true);
                setSheet('endCheck');
              }}
            >
              {t.register.end.endWithCheck}
            </button>
            <button
              className="button"
              onClick={() => {
                update((s) => marks.setEnd(s, nowIso()));
                go('/');
              }}
            >
              {t.register.end.endOnly}
            </button>
            <button className="button quiet" onClick={() => setSheet('none')}>
              {t.cancel}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === 'endCheck' && (
        <EndCheck
          session={session}
          students={roster.filter((s) => isPresent(session.marks[s.id]))}
          photoOf={photoOf}
          onSave={(ids) => {
            update((s) => marks.saveEndCheck(s, ids));
            if (ending) go('/');
            else setSheet('none');
          }}
          onSkip={() => (ending ? go('/') : setSheet('none'))}
        />
      )}

      {sheet === 'times' && (
        <TimesSheet
          session={session}
          live={live}
          update={update}
          onEndCheck={() => setSheet('endCheck')}
          onClose={() => setSheet('none')}
          onDelete={() => {
            const leave = () => go(correction ? '/past' : '/');
            if (saved.current) void store.deleteSession(session.id).then(leave);
            else leave();
          }}
        />
      )}
    </div>
  );
}

function Missing() {
  return (
    <>
      <TopBar title={t.appName} back="/" />
      <p className="muted pad">{t.register.classGone}</p>
    </>
  );
}

/** A time field with a Set button. */
function TimeRow({ label, initial, onSet, children }: { label: string; initial: string; onSet: (hhmm: string) => void; children?: ReactNode }) {
  const [value, setValue] = useState(initial);
  return (
    <label className="time-row">
      <span>{label}</span>
      <input type="time" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="button small-button" disabled={!value} onClick={() => onSet(value)}>
        {t.set}
      </button>
      {children}
    </label>
  );
}

/** The menu of one student: absent / excused / change time / left early / undo. */
function StudentMenu(props: {
  session: Session;
  student: Student;
  settings: SchoolSettings;
  live: boolean;
  apply: (change: (s: Session) => Session) => void;
  onClose: () => void;
}) {
  const { session, student, settings, live, apply, onClose } = props;
  const id = student.id;
  const mark = session.marks[id];
  const status = statusOf(session, id, settings);
  const present = isPresent(mark);
  const m = t.register.menu;
  const [reason, setReason] = useState(mark?.reason ?? '');
  /** Corrections are stamped; ordinary choices during class are not. */
  const stamp = live ? undefined : nowIso();
  const at = (hhmm: string) => atLocalTime(session.localDate, hhmm);
  const words = [...statusText(status, mark, live), mark?.arrivedAt && status.kind !== 'presentTimeUnknown' ? t.register.status.arrived(timeOf(mark.arrivedAt)) : ''].filter(Boolean);

  return (
    <Sheet title={student.name} sub={words.join(' · ') || t.register.status.notTickedYet} onClose={onClose}>
      <div className="stack">
        {!present && live && (
          <button className="button" onClick={() => apply((s) => marks.tickPresent(s, id, nowIso(), false))}>
            {m.presentNow}
          </button>
        )}
        {!(present && mark?.timeUnknown) && (
          <button className="button" onClick={() => apply((s) => marks.setTimeUnknown(s, id, nowIso()))}>
            {m.presentUnknown}
          </button>
        )}
        <TimeRow label={m.arrivalTime} initial={mark?.arrivedAt ? timeOf(mark.arrivedAt) : live ? timeOf(nowIso()) : ''} onSet={(v) => apply((s) => marks.setArrival(s, id, at(v), nowIso()))} />
        {present &&
          (mark?.leftAt ? (
            <button className="button" onClick={() => apply((s) => marks.setLeft(s, id, undefined, stamp))}>
              {m.removeLeft}
            </button>
          ) : live ? (
            <button className="button" onClick={() => apply((s) => marks.setLeft(s, id, nowIso()))}>
              {m.leftNow}
            </button>
          ) : (
            <TimeRow label={m.leftAt} initial="" onSet={(v) => apply((s) => marks.setLeft(s, id, at(v), nowIso()))} />
          ))}
        {!mark?.absent && (
          <button className="button" onClick={() => apply((s) => marks.setAbsent(s, id, stamp))}>
            {m.absent}
          </button>
        )}
        <div className="excuse-row">
          <input type="text" dir="auto" placeholder={m.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className={mark?.excused ? 'button small-button on' : 'button small-button'} onClick={() => apply((s) => marks.setExcused(s, id, !(mark?.excused && reason === (mark.reason ?? '')), reason, stamp))}>
            {m.excused}
          </button>
        </div>
        {mark && (
          <button className="button quiet" onClick={() => apply((s) => marks.clearMark(s, id))}>
            {m.undo}
          </button>
        )}
      </div>
    </Sheet>
  );
}

/** The end-of-class register: everyone present starts ticked; tap who has gone. */
function EndCheck(props: { session: Session; students: Student[]; photoOf: Map<string, string>; onSave: (stillHere: string[]) => void; onSkip: () => void }) {
  const { session, students, photoOf, onSave, onSkip } = props;
  const e = t.register.end;
  const [gone, setGone] = useState<Set<string>>(() => new Set(students.filter((s) => session.endCheckTaken && session.marks[s.id]?.endPresent === false).map((s) => s.id)));
  const toggle = (id: string) =>
    setGone((old) => {
      const next = new Set(old);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return (
    <div className="overlay">
      <TopBar title={e.checkTitle} sub={e.checkHint} />
      <div className="grid">
        {students.map((s) => (
          <button key={s.id} className={gone.has(s.id) ? 'tile tile-absent' : 'tile tile-here'} onClick={() => toggle(s.id)}>
            <Avatar name={s.name} photo={photoOf.get(s.id)} size={64} />
            <span className="tile-name" dir="auto">
              {s.name}
            </span>
            <span className="tile-status">{gone.has(s.id) ? e.gone : e.stillHere}</span>
          </button>
        ))}
      </div>
      <div className="bottom-bar stack">
        <button className="big-button" onClick={() => onSave(students.filter((s) => !gone.has(s.id)).map((s) => s.id))}>
          {e.saveCheck}
        </button>
        <button className="button quiet" onClick={onSkip}>
          {e.skip}
        </button>
      </div>
    </div>
  );
}

/** Start and end time by hand, the note, the end-of-class register, delete. */
function TimesSheet(props: { session: Session; live: boolean; update: (change: (s: Session) => Session) => void; onEndCheck: () => void; onClose: () => void; onDelete: () => void }) {
  const { session, live, update, onEndCheck, onClose, onDelete } = props;
  const x = t.register.times;
  const [note, setNote] = useState(session.note ?? '');
  const at = (hhmm: string) => atLocalTime(session.localDate, hhmm);
  const shiftStart = (minutes: number) => update((s) => (s.startedAt ? marks.setStart(s, new Date(Date.parse(s.startedAt) - minutes * 60000).toISOString()) : s));
  /** A class that runs past midnight: an end time before the start means the next day. */
  const endAt = (hhmm: string) => {
    const end = at(hhmm);
    return session.startedAt && end < session.startedAt ? new Date(Date.parse(end) + 86400000).toISOString() : end;
  };
  return (
    <Sheet title={t.register.classTimes} sub={formatDate(session.localDate)} onClose={onClose}>
      <div className="stack">
        <TimeRow key={`s${session.startedAt}`} label={x.start} initial={session.startedAt ? timeOf(session.startedAt) : ''} onSet={(v) => update((s) => marks.setStart(s, at(v)))} />
        {session.startedAt && (
          <div className="row">
            <button className="button small-button" onClick={() => shiftStart(1)}>
              {x.earlier1}
            </button>
            <button className="button small-button" onClick={() => shiftStart(5)}>
              {x.earlier5}
            </button>
            <button className="button small-button quiet" onClick={() => update((s) => marks.setStart(s, undefined))}>
              {x.clear}
            </button>
          </div>
        )}
        {!live && <TimeRow key={`e${session.endedAt}`} label={x.end} initial={session.endedAt ? timeOf(session.endedAt) : ''} onSet={(v) => update((s) => marks.setEnd(s, endAt(v)))} />}
        {!live && (
          <div className="row">
            <span className="grow">
              {x.endCheck}: {session.endCheckTaken ? x.endCheckTaken : x.endCheckNotTaken}
            </span>
            <button className="button small-button" onClick={onEndCheck}>
              {session.endCheckTaken ? x.redoEndCheck : x.takeEndCheck}
            </button>
            {session.endCheckTaken && (
              <button className="button small-button quiet" onClick={() => update(marks.clearEndCheck)}>
                {x.removeEndCheck}
              </button>
            )}
          </div>
        )}
        <label className="field">
          <span>{x.note}</span>
          <input type="text" dir="auto" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => update((s) => marks.setNote(s, note))} />
        </label>
        {session.endedAt && (
          <button className="button" onClick={() => update((s) => marks.setEnd(s, undefined))}>
            {x.reopen}
          </button>
        )}
        <button className="button danger" onClick={() => window.confirm(x.deleteConfirm) && onDelete()}>
          {x.delete}
        </button>
        <button className="big-button" onClick={onClose}>
          {t.done}
        </button>
      </div>
    </Sheet>
  );
}
