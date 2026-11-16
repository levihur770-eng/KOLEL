# Kolel Register - Progress archive

Full history. Finished rounds move here from `PROGRESS.md`.

## 2026-11-17 - Stage 0 and Stage 1 built (v1.0)

- Session started from `KOLEL-BUILD-BRIEF.txt` (written 2026-11-17 in a
  planning chat). Levi had already made the repository `levihur770-eng/KOLEL`
  and connected it, so no repository was created.
- Tools copied from The Folio (`levihur770-eng/folio-app`): Vite, React,
  TypeScript, Vitest, oxlint, the service worker approach
  (`src/serviceWorker.js`, `src/useAppUpdate.ts`, the plugin in
  `vite.config.ts`), `netlify.toml`, `test-latest.bat`.
- Storage tests use the `fake-indexeddb` package (tests only, not in the app).
- Details of the decisions and the one cause fixed are in `PROGRESS.md`.
