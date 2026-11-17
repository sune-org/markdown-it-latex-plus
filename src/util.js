const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
export const esc = s => String(s).replace(/[&<>"]/g, c => ENT[c])
export const unesc = s => s.replace(/&(amp|lt|gt|quot|#39|#x27|apos);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"' })[e] ?? "'")
export const msg = e => String(e?.message ?? e).replace(/\s+/g, ' ').trim().slice(0, 300)

// Plain objects merge key by key; anything else (arrays included) is replaced.
const obj = v => v && typeof v === 'object' && !Array.isArray(v)
export const merge = (a, ...r) => r.reduce((a, b) => {
  for (const k in b ?? {}) a[k] = obj(a[k]) && obj(b[k]) ? merge({ ...a[k] }, b[k]) : b[k]
  return a
}, a)

// Each URL is fetched once per page; a failed load can be tried again.
const seen = {}
export const script = u => seen[u] ||= new Promise((ok, no) => document.head.append(Object.assign(document.createElement('script'), {
  src: u, onload: ok, onerror: () => (delete seen[u], no(Error(`could not load ${u}`))),
})))
export const sheet = u => seen[u] ||= document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: u })) ?? 1
export const style = (id, css) => (document.getElementById(id) ?? document.head.appendChild(Object.assign(document.createElement('style'), { id }))).textContent = css
