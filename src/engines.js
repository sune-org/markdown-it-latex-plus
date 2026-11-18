// Browser renderers for fenced blocks. Each library is fetched the first time a block needs it.
// Every result is an SVG string, sanitised before it is cached or shown.
import { script, sheet } from './util.js'
import { tikzdoc } from './tikz.js'

export const LIBS = {
  dompurify: ['npm/dompurify@3.4.18/dist/purify.min.js', 'DOMPurify'],
  mermaid: ['npm/mermaid@12.3.0/dist/mermaid.esm.min.mjs'],
  viz: ['npm/@viz-js/viz@3.31.0/dist/viz-global.js', 'Viz'],
  vega: ['npm/vega@6.4.0/build/vega.min.js', 'vega'],
  vegaLite: ['npm/vega-lite@6.5.0/build/vega-lite.min.js', 'vegaLite'],
  abcjs: ['npm/abcjs@6.7.2/dist/abcjs-basic-min.js', 'ABCJS'],
  smiles: ['npm/smiles-drawer@2.4.2/dist/smiles-drawer.min.js', 'SmilesDrawer'],
}
// TeX compiled to WebAssembly, with chemfig and circuitikz added. See docs/engines.md to self-host.
export const TIKZ = 'https://markdown-it-latex-plus.pages.dev/tikzjax/'

export default o => {
  const got = {}
  // o.libs[name] may supply a loader (for example () => import('mermaid')) instead of the CDN copy.
  const lib = name => got[name] ||= (async () => {
    const [path, global] = LIBS[name], m = await (o.libs?.[name]?.() ?? (global ? script(o.cdn + path).then(() => globalThis[global]) : import(/* @vite-ignore */ o.cdn + path)))
    return m?.default ?? m
  })()

  // Off-screen but laid out, so libraries that measure text get real numbers.
  const stage = (...kids) => { const d = Object.assign(document.createElement('div'), { style: 'position:absolute;left:-99999px;top:0;width:720px' }); d.append(...kids); return d }
  const mount = d => document.body.appendChild(d)
  let ids = 0
  const purify = async (svg, fix) => {
    const P = await lib('dompurify'), t = document.createElement('template')
    t.innerHTML = P.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
    const root = t.content.querySelector('svg')
    if (!root) throw Error('nothing to draw')
    fix?.(root)
    // A viewBox lets CSS scale the figure down to its container instead of cropping it.
    const [w, h] = ['width', 'height'].map(k => parseFloat(root.getAttribute(k)))
    w && h && !root.hasAttribute('viewBox') && root.setAttribute('viewBox', `0 0 ${w} ${h}`)
    // Two figures on one page must not share ids, or one clips and paints with the other's defs.
    const map = {}, n = ++ids
    for (const e of root.querySelectorAll('[id]')) e.id = map[e.id] = `mlp${n}-${e.id}`
    for (const e of root.querySelectorAll('*')) for (const a of e.attributes) {
      const v = a.value.replace(/url\(["']?#([^"')]+)["']?\)/g, (m, id) => map[id] ? `url(#${map[id]})` : m)
      a.value = /href$/.test(a.name) && v[0] === '#' && map[v.slice(1)] ? '#' + map[v.slice(1)] : v
    }
    return root.outerHTML
  }

  // TikZJax wraps some matrix cells in nested <svg> viewports that land in the wrong place
  // (tikz-cd with empty cells loses its nodes). As plain groups they sit where TeX put them.
  const flatten = root => root.querySelectorAll('svg').forEach(s => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.append(...s.childNodes), s.replaceWith(g)
  })

  let viz, merm, n = 0
  return {
    svg: { render: s => purify(s) },

    tikz: { async render(src) {
      const { body, packages, libraries, preamble } = tikzdoc(src), base = o.tikz?.base ?? TIKZ
      const s = Object.assign(document.createElement('script'), { type: 'text/tikz', textContent: body }), at = stage(s)
      Object.assign(s.dataset, { texPackages: JSON.stringify(packages), ...libraries && { tikzLibraries: libraries }, ...preamble && { addToPreamble: preamble } })
      sheet(base + 'fonts.css')
      // TikZJax swaps the script for the finished <svg>, or for an <img> when TeX gives up.
      const done = new Promise((ok, no) => {
        at.addEventListener('tikzjax-load-finished', e => ok(e.target.outerHTML))
        new MutationObserver(() => at.querySelector('img') && (at.querySelector('img').remove(), no(Error('TeX could not compile this figure')))).observe(at, { childList: true, subtree: true })
        setTimeout(() => no(Error('TeX took too long')), o.tikz?.timeout ?? 90000)
      })
      // The script must already be inside when the stage joins the page: TikZJax watches for added
      // nodes, and told about the same script twice it loses track of it and never finishes.
      mount(at)
      try { return await script(base + 'tikzjax.js').then(() => done).then(s => purify(s, flatten)) } finally { at.remove() }
    } },

    mermaid: { async render(src) {
      const m = await lib('mermaid'), id = `mlp-mermaid-${++n}`
      merm ||= (m.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', ...o.mermaid }), 1)
      try { return (await m.render(id, src)).svg } finally { for (const x of [id, 'd' + id]) document.getElementById(x)?.remove() }
    } },

    dot: { async render(src) {
      const v = await (viz ||= lib('viz').then(V => V.instance()))
      return purify(v.renderString(src, { format: 'svg', ...o.dot }))
    } },

    'vega-lite': { async render(src) {
      // In this order: the vega-lite build looks for the vega global while it loads.
      const vega = await lib('vega'), lite = await lib('vegaLite'), spec = JSON.parse(src)
      // Specs come from a model, so they may not fetch anything unless the host supplies a loader.
      let blocked
      const loader = o.vega?.loader ?? Object.assign(vega.loader(), { load: async u => { throw Error(blocked = `remote data is turned off (${u}); put the values in the spec`) } })
      const full = /\/vega\/v\d/.test(spec.$schema ?? '') ? spec : lite.compile(spec).spec
      const svg = await new vega.View(vega.parse(full), { renderer: 'none', loader, logLevel: vega.Error }).toSVG()
      if (blocked) throw Error(blocked)
      return purify(svg)
    } },

    abc: { async render(src) {
      const A = await lib('abcjs'), at = mount(stage())
      try {
        A.renderAbc(at, src, { staffwidth: 640, ...o.abc })
        return await purify(at.innerHTML)
      } finally { at.remove() }
    } },

    smiles: { async render(src) {
      const S = await lib('smiles'), at = mount(stage()), el = at.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
      const size = { width: 340, height: 230, ...o.smiles }
      for (const k of ['width', 'height']) el.setAttribute(k, size[k])
      el.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`)
      try {
        await new Promise((ok, no) => S.parse(src.trim(), t => { try { new S.SvgDrawer(size).draw(t, el, size.theme ?? 'light'); ok() } catch (e) { no(e) } }, no))
        return await purify(el.outerHTML)
      } finally { at.remove() }
    } },
  }
}
