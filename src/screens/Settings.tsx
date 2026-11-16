/** Screen F: grace minutes, backup file, example data, About. */
import { useState, type ChangeEvent } from 'react';
import { TopBar } from '../components/ui';
import { makeBackup, readBackup } from '../data/backup';
import { loadExample } from '../data/actions';
import { isDemoId, withoutDemo } from '../data/demo';
import { useLive, useStore } from '../data/useStore';
import { localDateOf } from '../logic/time';
import { t } from '../text/en';
import { APP_VERSION } from '../version';

function download(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function Settings() {
  const store = useStore();
  const school = useLive((s) => s.getSchool());
  const classes = useLive((s) => s.listClasses());
  const [message, setMessage] = useState('');
  const x = t.settings;

  if (!school || !classes) return <p className="muted pad">{t.loading}</p>;
  const hasDemo = classes.some((c) => isDemoId(c.id));
  const setGrace = (n: number) => void store.saveSchool({ ...school, settings: { ...school.settings, graceMinutes: Math.min(60, Math.max(0, n)) } });

  const saveBackup = async () => {
    const now = new Date().toISOString();
    download(`kolel-register-backup-${localDateOf(now)}.json`, makeBackup(await store.exportAll(), now));
  };
  const openBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = readBackup(await file.text());
      if (!window.confirm(x.openConfirm)) return;
      await store.replaceAll(data);
      setMessage(x.opened);
    } catch (err) {
      setMessage(err instanceof Error && err.message === 'newer-format' ? x.newerFile : x.badFile);
    }
  };
  const addExample = async () => {
    await loadExample(store, localDateOf(new Date().toISOString()));
    setMessage(x.exampleLoaded);
  };
  const removeExample = async () => {
    await store.replaceAll(withoutDemo(await store.exportAll()));
    setMessage(x.exampleRemoved);
  };

  return (
    <>
      <TopBar title={x.title} />
      {message && <p className="notice pad">{message}</p>}
      <section className="card">
        <h2>{x.grace}</h2>
        <div className="row">
          <button className="button stepper" aria-label="-" onClick={() => setGrace(school.settings.graceMinutes - 1)}>
            {'−'}
          </button>
          <strong className="grace-value">
            {school.settings.graceMinutes} {x.minutes}
          </strong>
          <button className="button stepper" aria-label="+" onClick={() => setGrace(school.settings.graceMinutes + 1)}>
            +
          </button>
        </div>
        <p className="muted small">{x.graceHint}</p>
      </section>
      <section className="card stack">
        <h2>{x.backup}</h2>
        <p className="muted small">{x.backupHint}</p>
        <button className="button" onClick={() => void saveBackup()}>
          {x.saveBackup}
        </button>
        <label className="button">
          {x.openBackup}
          <input type="file" accept=".json,application/json" hidden onChange={(e) => void openBackup(e)} />
        </label>
      </section>
      <section className="card stack">
        <h2>{x.example}</h2>
        {hasDemo ? (
          <button className="button" onClick={() => void removeExample()}>
            {x.removeExample}
          </button>
        ) : (
          <button className="button" onClick={() => void addExample()}>
            {x.loadExample}
          </button>
        )}
      </section>
      <section className="card">
        <h2>{x.about}</h2>
        <p>
          <strong>{t.appName}</strong> {'·'} {x.version(APP_VERSION)}
        </p>
        <p className="muted small">{x.aboutText}</p>
      </section>
    </>
  );
}
