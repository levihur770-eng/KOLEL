# Kolel Register - notes for Claude Code

Read in this order before doing anything:
1. `KOLEL-BUILD-BRIEF.txt` - the spec, the stages, and how to work with Levi.
2. `PROGRESS.md` - what is true now, decisions, the next step, versions.
3. `FEATURE-MAP.md` - which file does which feature.
`PROGRESS-ARCHIVE.md` holds the full history (only when you need an old
cause or decision). `IDEAS.md` holds ideas Levi wants kept, not built.
If `KOLEL-ANSWERS.txt` exists, its answers override the defaults in section 9
of the brief.

## Working with Levi

- Levi is a teacher, not a programmer. Plain words, one step at a time. No
  compliments. Do the technical and tedious steps yourself.
- Steps only he can do: numbered, one action per line, exact link or path.
- EVERY message to him ends with a `NEXT:` line: either "answer in this
  chat." or "a new chat is fine / better, because ..." plus a ready
  `NEXT-CHAT-PROMPT.txt` handed to him as a file. Never ask him to copy text
  out of the chat.
- Use the stage names from the brief ("Stage 1 - The Register").

## Rules of the code (do not break these)

1. Store facts, compute judgements. Sessions hold raw moments and ticks.
   "Late", "on time", "absent", percentages are computed in `src/logic/` and
   NEVER stored. (Brief P1.)
2. "Not recorded" is never "absent". A session with no marks counts against
   nobody. (Brief P2.)
3. Screens never touch storage directly. They use `useStore()` / `useLive()`
   and the `Store` interface in `src/data/store.ts`. Stage 3 adds a second
   implementation of that interface; it must not change the screens.
4. Every change to a session goes through a pure function in
   `src/logic/marks.ts`. Every judgement comes from `src/logic/status.ts`.
   Both have tests; a change there needs a test.
5. Every word the user sees lives in `src/text/en.ts`. Names are shown with
   `dir="auto"` (they may be Hebrew).
6. Times: stored as UTC text; shown and grouped by day in Europe/Budapest
   only through `src/logic/time.ts`. Never use `getHours()`, `toLocaleTimeString()`
   or the phone's own time zone.
7. Few dependencies. The app itself uses only React. Ask before adding one.

## Fixing problems

Find the cause, fix the rule, no forced patches. Add a test that would have
caught it. Write the cause and the fix in `PROGRESS.md`.

## Versions and branches

- Work happens on a branch. Each round Levi tests gets a version (v1.0,
  v1.1 ...): raise `APP_VERSION` in `src/version.ts`, list it in
  `PROGRESS.md` with its checkpoint (git tag, or the commit code if tags
  cannot be pushed).
- "Update the main" from Levi = put the version he just tested on `main`.
  Nothing goes on `main` before he says so. Netlify publishes `main`.
- When a round is finished, move its details from `PROGRESS.md` to
  `PROGRESS-ARCHIVE.md` so `PROGRESS.md` stays short. Keep `FEATURE-MAP.md`
  up to date in the same commit as the code.

## Commands

- `npm run dev` - the app on http://localhost:5173 (keep this port and
  script; `test-latest.bat` needs them). No offline copy in this mode.
- `npm test` - automated checks (Vitest). Must pass before every commit.
- `npx tsc -b`, `npm run lint` - type check and lint. Both must be clean.
- `npm run build` then `npx vite preview` - the real website version in
  `dist/`, with the offline copy (service worker). Test offline behaviour
  here, in a phone-sized browser (Playwright is available in cloud sessions).
- `node scripts/make-icons.cjs` - remakes the PNG icons from `icon.svg`.
