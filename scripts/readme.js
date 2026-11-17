// npm shows the README from the package root, while this repo keeps it in docs/.
// prepack copies it up with links made absolute; `node scripts/readme.js clean` removes the copy.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'

const repo = 'https://github.com/sune-org/markdown-it-latex-plus', raw = 'https://raw.githubusercontent.com/sune-org/markdown-it-latex-plus/main/docs/'
if (process.argv[2] === 'clean') rmSync('README.md', { force: true })
else writeFileSync('README.md', readFileSync('docs/README.md', 'utf8')
  .replace(/(src=")(img\/)/g, `$1${raw}$2`)
  .replace(/\]\((?!https?:|#)([^)]+)\)/g, (_, p) => `](${repo}/blob/main/${p.startsWith('../') ? p.slice(3) : 'docs/' + p})`))
