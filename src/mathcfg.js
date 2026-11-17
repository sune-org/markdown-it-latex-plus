import { merge, unesc } from './util.js'

// TeX packages MathJax does not pull in by itself. The rest (ams, mhchem, cancel, color, braket,
// bussproofs, amscd, bbox, ...) autoload on first use. physics is opt-in: it redefines \div.
export const PACKAGES = ['mathtools', 'enclose', 'colortbl', 'cases', 'empheq', 'upgreek', 'centernot', 'gensymb', 'textcomp', 'units', 'begingroup']

export const config = (o, ...more) => {
  const pk = [...PACKAGES, ...o.packages ?? []]
  return merge({
    loader: { load: ['ui/safe', ...pk.map(p => `[tex]/${p}`)] },
    tex: {
      packages: { '[+]': pk },
      autoload: { bbm: ['mathbbm', 'mathbbmss', 'mathbbmtt'], dsfont: ['mathds'] },
      macros: o.macros ?? {},
      // \require may load packages, but not the two that let TeX emit raw HTML or rewrite this configuration.
      require: { allow: { texhtml: false, setoptions: false } },
    },
    svg: { fontCache: 'local' },
  }, ...more, o.mathjax)
}

// Serialised MathJax output: surface TeX errors as exceptions and drop the per-node source copies.
const clean = h => {
  const m = h.match(/data-mjx-error="([^"]*)"/)
  if (m) throw Error(unesc(m[1]))
  return h.replace(/ data-latex(-item)?="[^"]*"/g, '')
}

// The same engine on both sides; only how MathJax gets loaded differs.
export const engine = start => {
  let p, M, busy = 0, loads = Promise.resolve(), q = loads
  const load = o => p ||= start(o).then(m => M = m)
  const html = n => clean(M.startup.adaptor.outerHTML(n))
  const RETRY = Object.assign(Error('MathJax is loading'), { retry: true })
  return {
    load,
    ok: () => !!M,
    css: () => M ? M.startup.adaptor.textContent(M.svgStylesheet()) : '',
    // Typeset now, or throw an error with .retry set when a font or package has to be fetched first.
    // Nothing may be typeset while such a fetch is running: commands still loading would come out as undefined.
    sync(s, d) {
      if (busy) throw RETRY
      try { return M.texReset(), html(M.tex2svg(s, { display: !!d })) } catch (e) {
        if (e.retry) busy++, loads = Promise.allSettled([loads, e.retry]).finally(() => busy--)
        throw e
      }
    },
    // One at a time: MathJax must not start a conversion while another waits on a download.
    render(s, d, o) {
      const go = async () => {
        await load(o)
        busy++
        try { return await loads, M.texReset(), html(await M.tex2svgPromise(s, { display: !!d })) } finally { busy-- }
      }
      const r = q.then(go, go)
      q = r.catch(() => {})
      return r
    },
  }
}
