/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * Writes `sw.js` (from `src/serviceWorker.js`) into the built app, with the
 * list of every built file and a version that changes when any file changes.
 */
function serviceWorker(): Plugin {
  let outDir = 'dist'
  return {
    name: 'kolel-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    writeBundle() {
      const files: string[] = []
      const walk = (dir: string) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name)
          if (e.isDirectory()) walk(p)
          else if (!/^(sw\.js|README\.txt|_headers|_redirects)$/.test(e.name)) files.push(p)
        }
      }
      walk(outDir)
      const template = readFileSync('src/serviceWorker.js', 'utf8')
      const hash = createHash('sha256').update(template)
      for (const f of files.sort()) hash.update(f).update(readFileSync(f))
      const urls = files.map((f) => '/' + relative(outDir, f).split(sep).join('/'))
      const head = `self.__FILES__ = ${JSON.stringify(urls)};\nself.__VERSION__ = ${JSON.stringify(hash.digest('hex').slice(0, 12))};\n`
      writeFileSync(join(outDir, 'sw.js'), head + template)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Keep the default port: test-latest.bat opens http://localhost:5173.
  server: { port: 5173 },
  test: { include: ['src/**/*.test.ts'] },
})
