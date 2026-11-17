import { config, engine } from './mathcfg.js'
import { script } from './util.js'

export const MATHJAX = 'npm/mathjax@4.1.3/tex-svg.js', XYPIC = 'gh/sonoisa/XyJax-v4@4.0.4/build'

// A MathJax 4 the page already loaded is reused as is; otherwise ours is configured and fetched.
export const { load, ok, css, sync, render } = engine(o => globalThis.MathJax?.tex2svgPromise ? Promise.resolve(globalThis.MathJax) : new Promise((ok, no) => {
  const xy = o.xypic !== false
  globalThis.MathJax = config(o, {
    options: { enableMenu: false, enableEnrichment: false, enableSpeech: false, enableBraille: false, enableExplorer: false },
    startup: { typeset: false, ready() { MathJax.startup.defaultReady(); MathJax.startup.promise.then(() => ok(MathJax), no) } },
  })
  // xy-pic is a third-party extension, so it gets its own path instead of [tex]/.
  if (xy) MathJax.loader.paths = { mlp: o.cdn + XYPIC, ...MathJax.loader.paths }, MathJax.loader.load.push('[mlp]/xypic.js'), MathJax.tex.packages['[+]'].push('xypic')
  script(o.cdn + MATHJAX).catch(no)
}))
