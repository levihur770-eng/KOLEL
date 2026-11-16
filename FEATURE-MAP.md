# Feature map - which file does what

Keep this up to date in the same commit as the code.

## The rules (pure functions, tested; change with care)

| File | Does |
|------|------|
| `src/logic/status.ts` | Facts -> judgement: not recorded / on time / late N min / present / absent, excused, left early. Roster of a session. Counts. "Class in progress". |
| `src/logic/marks.ts` | Every change to a session: new session, tick, absent, excused, arrival time, left early, undo, Everyone here, start / end, end-of-class register, note. |
| `src/logic/time.ts` | Europe/Budapest day and clock time of a moment; typed time -> moment; durations; dates. |
| `src/logic/names.ts` | Pasted list of names, initials, sorting by name. |
| `src/logic/*.test.ts` | The tests for the above. |

## The data

| File | Does |
|------|------|
| `src/data/types.ts` | The shape of school, student, photo, class, session, mark. Defaults. |
| `src/data/store.ts` | THE storage interface. Screens use only this. |
| `src/data/idbStore.ts` | The interface on the phone's own storage (IndexedDB). |
| `src/data/useStore.ts` | `useStore()` to write, `useLive()` to read and stay current, `useNow()` clock. |
| `src/data/backup.ts` | Backup file: write, and check before opening. |
| `src/data/demo.ts` | "Load example class" / "Remove example data" (ids start with `demo-`). |
| `src/data/photo.ts` | Shrinks a picture to a 160 x 160 JPEG text. |
| `src/data/actions.ts` | Add a class; load the example (used by two screens). |
| `src/data/data.test.ts` | Tests: store, backup, example data. |

## The screens

| Screen (brief) | File | Address |
|------|------|------|
| A Home: classes, Take register, class in progress | `src/screens/Home.tsx` | `#/` |
| B Register, and correcting a past session: tiles, Start, clock, student menu, End, end-of-class register, times sheet | `src/screens/Register.tsx` (+ `statusText.ts`: the words on a tile) | `#/register/<classId>/<sessionId>[/<date>]` |
| C Past sessions, "Add a session I forgot" | `src/screens/Past.tsx` | `#/past` |
| D Classes and all students | `src/screens/People.tsx` | `#/people` |
| D One class: name, usual time, students, paste names | `src/screens/ClassEdit.tsx` | `#/class/<id>` |
| D One student: name, photo, note, classes, archive | `src/screens/StudentEdit.tsx` | `#/student/<id>` |
| F Settings: grace, backup, example data, About | `src/screens/Settings.tsx` | `#/settings` |
| E Reports | not built (Stage 2) | |

## The frame

| File | Does |
|------|------|
| `src/App.tsx` | Picks the screen from the address after `#`; tab bar; "new version ready" bar. |
| `src/components/nav.ts` | `go()`, `useRoute()`, `newId()`. |
| `src/components/ui.tsx` | Avatar (photo or initials), TopBar, Sheet (bottom panel). |
| `src/text/en.ts` | ALL user-visible text. |
| `src/styles.css` | All styling; light and dark; colours as variables at the top. |
| `src/version.ts` | The version number shown in About. |
| `src/serviceWorker.js`, `src/useAppUpdate.ts`, `vite.config.ts` | Offline copy of the app and updating it. |
| `public/manifest.webmanifest`, `public/icons/` | Installing on the home screen. |
| `netlify.toml` | How Netlify builds and serves the site. |
| `test-latest.bat`, `kolel-first-time-setup.bat` | Levi's double-click files for testing on Windows. |
