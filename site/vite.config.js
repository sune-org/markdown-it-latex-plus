import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { createReadStream, existsSync } from 'node:fs'

const at = p => fileURLToPath(new URL(p, import.meta.url))

// Vite's servers label *.gz files as gzip-encoded, so the browser unpacks them before TikZJax can.
// Hand them over untouched, the way a static host does.
const gz = (req, res, next) => {
  const path = req.url.split('?')[0], file = ['public', 'dist'].map(d => at(d + path)).find(existsSync)
  if (!path.startsWith('/tikzjax/') || !path.endsWith('.gz') || !file) return next()
  res.setHeader('Content-Type', 'application/gzip')
  createReadStream(file).pipe(res)
}

// The site runs the plugin straight from ../src, so what you see is what the repo contains.
export default defineConfig({
  resolve: { alias: { 'markdown-it-latex-plus': at('../src/index.js') } },
  server: { fs: { allow: ['..'] } },
  plugins: [{ name: 'raw-gz', configureServer: s => void s.middlewares.use(gz), configurePreviewServer: s => void s.middlewares.use(gz) }],
})
