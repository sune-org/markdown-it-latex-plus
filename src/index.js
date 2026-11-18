import * as math from '#math'
import engines from '#engines'
import { inline, block, closed } from './rules.js'
import { base } from './css.js'
import { esc, msg, style } from './util.js'

export { prompt } from './prompt.js'
export { tikzdoc } from './tikz.js'

const CDN = 'https://cdn.jsdelivr.net/'
const KINDS = ['tikz', 'mermaid', 'dot', 'vega-lite', 'abc', 'smiles', 'svg']
const ALIAS = { pgfplots: 'tikz', tikzcd: 'tikz', circuitikz: 'tikz', chemfig: 'tikz', graphviz: 'dot', vegalite: 'vega-lite', abcjs: 'abc' }
const DOM = typeof document !== 'undefined'

// One runtime holds the options, the render cache and the engines. md.render() stays synchronous:
// whatever is cached (or can be typeset on the spot) comes out finished, the rest as placeholders
// that hydrate() or render() fill in afterwards.
export const runtime = (opt = {}) => {
  const o = { cdn: CDN, delimiters: 'all', environments: true, cache: 500, ...opt }
  const E = { ...engines(o), ...o.renderers }, cache = new Map, pending = new Map, misses = []
  const key = (k, src, d) => `${k}${d ? 1 : 0}\0${src}`
  const put = (k, v) => (cache.set(k, v), cache.size > o.cache && cache.delete(cache.keys().next().value), v)
  const wrap = (tag, cls, kind, inner, attr = '') => `<${tag} class="mlp ${cls}" data-mlp="${kind}"${attr}>${inner}</${tag}>`
  const code = src => `<pre><code>${esc(src)}</code></pre>`

  const get = (k, src, d) => {
    const K = key(k, src, d)
    if (cache.has(K)) return Promise.resolve(cache.get(K))
    if (!pending.has(K)) pending.set(K, Promise.resolve().then(() => k === 'math' ? math.render(src, d, o) : E[k].render(src))
      .then(h => ({ h }), e => ({ e: msg(e) }))
      .then(v => (pending.delete(K), put(K, v))))
    return pending.get(K)
  }

  const html = {
    math(src, d, blk) {
      const tag = blk ? 'div' : 'span', cls = `mlp-math${d ? ' mlp-display' : ''}`, K = key('math', src, d)
      let v = cache.get(K)
      if (!v && math.ok()) try { v = put(K, { h: math.sync(src, d) }) } catch (e) { e.retry || (v = put(K, { e: msg(e) })) }
      if (!v) return rt.collect && misses.push(['math', src, d]), wrap(tag, `${cls} mlp-pending`, 'math', esc(src), d ? ' data-d="1"' : '')
      return v.e ? wrap(tag, `${cls} mlp-error`, 'math', esc(src), ` title="${esc(v.e)}"`) : wrap(tag, cls, 'math', v.h)
    },
    block(k, src) {
      const v = cache.get(key(k, src))
      if (!v) return rt.collect && E[k] && misses.push([k, src]), wrap('div', 'mlp-block mlp-pending', k, code(src), ` data-src="${esc(src)}"`)
      return v.e ? wrap('div', 'mlp-block mlp-error', k, `${code(src)}<p class="mlp-msg">${esc(v.e)}</p>`) : wrap('div', `mlp-block mlp-${k}`, k, v.h)
    },
  }

  const rt = {
    options: o, cache, misses, html, get,
    // The block kind a fence language maps to, or undefined when it is not ours (or switched off).
    kind: lang => { const k = ALIAS[lang] ?? lang; if ((KINDS.includes(k) || k in E) && o.blocks?.[k] !== false) return k },
    css: () => base + math.css(),
    ready: () => math.load(o).then(() => { DOM && o.css !== false && style('mlp-css', rt.css()) }),
    // Fill in every placeholder under root. Safe to call after each re-render while streaming.
    async hydrate(root = document) {
      DOM && o.css !== false && !document.getElementById('mlp-css') && style('mlp-css', rt.css())
      const els = [...root.querySelectorAll('.mlp-pending')]
      await Promise.all(els.map(async el => {
        // A figure's source travels in data-src: copy buttons and highlighters may have changed the visible <pre>.
        const k = el.dataset.mlp, src = el.dataset.src ?? el.textContent, d = !!el.dataset.d
        if (k !== 'math' && !E[k]) return
        k === 'math' && await rt.ready().catch(() => {})
        await get(k, src, d)
        if (el.isConnected && el.classList.contains('mlp-pending')) el.outerHTML = k === 'math' ? html.math(src, d, el.tagName === 'DIV') : html.block(k, src)
      }))
    },
  }
  return rt
}

let last
// Hydrate with the most recently installed plugin instance, or a default one for pre-rendered pages.
export const hydrate = (root, opt) => (opt ? runtime(opt) : last ||= runtime()).hydrate(root)

export default function latexPlus(md, opt) {
  const rt = last = runtime(opt), o = rt.options
  const d = { dollars: o.delimiters !== 'brackets', brackets: o.delimiters !== 'dollars' }
  md.inline.ruler.before('escape', 'math_inline', inline(d))
  md.block.ruler.before('fence', 'math_block', block(d, o.environments), { alt: ['paragraph', 'reference', 'blockquote', 'list'] })
  md.core.ruler.push('mlp_fence', state => {
    const lines = state.src.split('\n')
    for (const t of state.tokens) {
      const k = t.type === 'fence' && rt.kind(t.info.trim().split(/\s+/)[0].toLowerCase())
      if (k && closed(t, lines)) t.meta = { ...t.meta, mlp: k }
    }
  })
  const fence = md.renderer.rules.fence
  Object.assign(md.renderer.rules, {
    math_inline: (t, i) => rt.html.math(t[i].content, t[i].meta.display, 0),
    math_block: (t, i) => rt.html.math(t[i].content, 1, 1) + '\n',
    mlp_block: (t, i) => rt.html.block(t[i].meta.kind, t[i].content) + '\n',
    fence: (t, i, ...a) => t[i].meta?.mlp ? rt.html.block(t[i].meta.mlp, t[i].content.replace(/\n$/, '')) + '\n' : fence(t, i, ...a),
  })
  md.latexPlus = Object.assign(rt, {
    // Async render: everything this environment can typeset comes back finished.
    async render(src, env) {
      await rt.ready()
      rt.collect = 1
      const out = md.render(src, env), todo = rt.misses.splice(0)
      rt.collect = 0
      if (!todo.length) return out
      await Promise.all(todo.map(a => rt.get(...a)))
      return md.render(src, env)
    },
  })
}
