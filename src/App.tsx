/** Chooses the screen from the address after # and shows the tab bar. */
import { go, useRoute } from './components/nav';
import { ClassEdit } from './screens/ClassEdit';
import { Home } from './screens/Home';
import { Past } from './screens/Past';
import { People } from './screens/People';
import { Register } from './screens/Register';
import { Settings } from './screens/Settings';
import { StudentEdit } from './screens/StudentEdit';
import { t } from './text/en';
import { useAppUpdate } from './useAppUpdate';

const TABS = [
  { path: '/', key: '', label: t.tabs.home, icon: '✓' },
  { path: '/past', key: 'past', label: t.tabs.past, icon: '◷' },
  { path: '/people', key: 'people', label: t.tabs.people, icon: '☺' },
  { path: '/settings', key: 'settings', label: t.tabs.settings, icon: '⚙' },
];

export function App() {
  const route = useRoute();
  const { updateReady, applyUpdate } = useAppUpdate();
  const [screen = '', a, b, c] = route;

  let content;
  let tab = screen;
  if (screen === 'register' && a && b) {
    // key: a different session is a fresh screen, never a reused one.
    content = <Register key={b} classId={a} sessionId={b} date={c} />;
    tab = 'none';
  } else if (screen === 'past') content = <Past />;
  else if (screen === 'people') content = <People />;
  else if (screen === 'class' && a) {
    content = <ClassEdit key={a} classId={a} />;
    tab = 'people';
  } else if (screen === 'student' && a) {
    content = <StudentEdit key={a} studentId={a} backTo={b ? `/class/${b}` : '/people'} />;
    tab = 'people';
  } else if (screen === 'settings') content = <Settings />;
  else {
    content = <Home />;
    tab = '';
  }

  return (
    <div className="app">
      {updateReady && (
        <div className="update-bar">
          {t.updateReady} <button onClick={applyUpdate}>{t.updateReload}</button>
        </div>
      )}
      <main className="screen">{content}</main>
      {tab !== 'none' && (
        <nav className="tabbar">
          {TABS.map((x) => (
            <button key={x.key} className={x.key === tab ? 'tab tab-on' : 'tab'} onClick={() => go(x.path)}>
              <span className="tab-icon" aria-hidden="true">
                {x.icon}
              </span>
              {x.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
