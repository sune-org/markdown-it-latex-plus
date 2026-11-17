// Assemble public/tikzjax: the TikZJax browser engine plus the TeX files for chemfig, circuitikz
// and tikz-feynhand, which the stock build leaves out. The plugin's default tikz.base points here.
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync, gzipSync } from 'node:zlib'

const out = 'public/tikzjax', dist = 'node_modules/@drgrice1/tikzjax/dist'
existsSync(`${out}/tikzjax.js`) || cpSync(dist, out, { recursive: true, filter: f => !f.endsWith('.map') })

// node-tikzjax ships those extra packages as a plain tar; each file goes in gzipped, as the engine expects.
const tar = gunzipSync(readFileSync('node_modules/node-tikzjax/tex/tex_files.tar.gz')), str = (a, b) => tar.subarray(a, b).toString().replace(/\0[\s\S]*$/, '')
let added = 0
for (let p = 0, path; p + 512 <= tar.length && (path = str(p, p + 100));) {
  const name = path.split('/').pop(), size = parseInt(str(p + 124, p + 136).trim(), 8) || 0, file = `${out}/tex_files/${name}.gz`
  if (name && size && '0\0'.includes(String.fromCharCode(tar[p + 156])) && !existsSync(file)) writeFileSync(file, gzipSync(tar.subarray(p + 512, p + 512 + size), { level: 9 })), added++
  p += 512 + Math.ceil(size / 512) * 512
}

writeFileSync(`${out}/NOTICE.txt`, `TikZJax: TeX compiled to WebAssembly, drawing TikZ pictures in the browser.

Engine      @drgrice1/tikzjax (GPL-3.0-or-later)   https://github.com/drgrice1/tikzjax
            after Jim Fowler's TikZJax             https://github.com/kisonecat/tikzjax
Extra TeX   from node-tikzjax (LPPL-1.3c)          https://github.com/prinsss/node-tikzjax
Fonts       BaKoMa Computer Modern (see bakoma/)

These files are unmodified copies of those projects, served here so that markdown-it-latex-plus
can load them. Source code for every part is at the links above.
`)
console.log(`tikzjax ready: ${added} extra TeX files added`)
