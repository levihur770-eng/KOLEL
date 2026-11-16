# Kolel Register - Progress

Short on purpose: what is true now and what comes next. Full history:
`PROGRESS-ARCHIVE.md`. Which code does what: `FEATURE-MAP.md`.

## Stage map

```
[done]  Stage 0 - Foundations
[test]  Stage 1 - The Register      (built; waiting for Levi's test of v1.0)
[next]  Stage 2 - The Report
[later] Stage 3 - The School        (ask Q10 first: whose Google account)
[later] Stage 4 - Extras            (each only if Levi asks)
```

## Where things stand (2026-11-17)

- Repository: `levihur770-eng/KOLEL` (Levi made it himself; the brief's name
  "kolel-register" was not used). Work branch: `claude/bold-allen-1tv8l0`.
- `main` does NOT exist yet. It is created when Levi says "update the main"
  after testing v1.0. Until then GitHub shows the work branch as default.
- Netlify: not connected yet. Levi got the steps on 2026-11-17. Write the
  site address here once he gives it.
- No `KOLEL-ANSWERS.txt` was given: all defaults of the brief's section 9
  are in force.

## Versions

| Version | Checkpoint | What | Levi's verdict |
|---------|------------|------|----------------|
| v1.0 | commit `dd2161a` (tags cannot be pushed from cloud sessions) | Stage 0 + Stage 1: register, past sessions, students and classes, backup, offline | not tested yet |

## Decisions made while building (Levi may reverse any; ask before undoing)

1. `session.rosterIds` was ADDED to the brief's data shape: the class list
   of that day, kept in step with the class while the session is live,
   frozen once it has ended. Reason: without it a student added later looks
   absent in old sessions, and an archived student's absences vanish.
   Roster of a session = rosterIds + anyone with a mark.
2. Lateness is in whole minutes from `startedAt`. Under one full minute
   after Start is on time (the app never says "late 0 min"). Late = more
   whole minutes than `graceMinutes`. The minutes shown always count from
   the start, not from the end of the grace period.
3. Moving the start time by hand re-judges everyone (also students ticked
   before Start was pressed), because only facts are stored.
4. live = session of today and not ended. Anything else is a correction:
   a tap means "present, time not known" and changes are stamped `editedAt`.
   A time typed by hand is always stamped `editedAt`.
5. A register that was only looked at (no tick, no Start) is not saved, so
   no empty sessions pile up. A session is saved from the first change.
6. "Class in progress" on the first screen = a session of today, begun, not
   ended. An unended session of an earlier day stays "not ended" in Past.
7. End-of-class register: everyone present starts ticked "Still here"; Levi
   taps who has gone, then Save. (The brief said "tick who is still there";
   pre-ticked is faster. Skip records nothing.)
8. Extra, not in the brief: "Add a session I forgot" (Past screen) makes a
   session for an earlier date; ticks there are "time not known".
9. A class that runs past midnight: an end time typed earlier than the start
   is taken as the next day.
10. Long-press (right-click) on a tile opens the menu directly, e.g. to mark
    an unticked student absent or excused.

## Causes found and fixed

- Offline: built files were stored but not used when the server sent a
  "Vary: Origin" header (vite preview does). Fixed in `src/serviceWorker.js`
  with `ignoreVary` (safe: one cache per app version). Checked by running a
  whole lesson offline in a phone-sized browser. No unit test: a service
  worker cannot run in Vitest; repeat the offline check after changing it.

## How Stage 1 was checked

- `npm test`: 50 checks (status rules, marks, time zone and clock-change
  days, names, store on IndexedDB, backup file, example data).
- A whole lesson in a phone-sized browser with the internet off, phone clock
  set to New York: early ticks, Start, late ticks with minutes, absent /
  excused / left early, reload mid-class, end with and without the end
  register, correct an older session, paste names, photo, backup save / open.
  NOT checked: a real phone, installing to the home screen, the real camera.

## Next step

1. Levi tests v1.0 (computer: `test-latest.bat`; phone: after Netlify).
2. Fix what he reports (v1.1 ...). When he says "update the main": create
   `main` from the tested version; tell him to set Netlify's production
   branch to `main`.
3. Then Stage 2 - The Report (screen E; rules in `src/logic/`, thresholds in
   `src/logic/thresholds.ts`, Excel + PDF + student slips).
