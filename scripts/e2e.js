// Browser checks the Node tests cannot make: hostile input to every renderer, error display, and
// streaming behaviour. Runs against the site, which exposes its markdown-it instance as window.md.
//   node scripts/e2e.js [url]        (default http://localhost:5173)
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173'
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const page = await browser.newPage()
const dialogs = []
page.on('dialog', d => (dialogs.push(d.message()), d.dismiss()))
await page.goto(url, { waitUntil: 'load' })

const fence = (lang, body) => '```' + lang + '\n' + body + '\n```'
const PWN = 'window.__pwned=1'
const hostile = {
  'svg: script, handlers, js links': fence('svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>${PWN}</script><a href="javascript:${PWN}"><text y="9">x</text></a><image href="x" onerror="${PWN}"/><foreignObject><img src="x" onerror="${PWN}"></foreignObject><rect width="5" height="5" onclick="${PWN}" style="background:url(javascript:${PWN})"/></svg>`),
  'dot: URL and HTML label': fence('dot', `digraph { a [URL="javascript:${PWN}", label="<img src=x onerror=${PWN}>", tooltip="\\" onmouseover=\\"${PWN}"] a -> b }`),
  'mermaid: HTML label and click': fence('mermaid', `flowchart LR\n  A["<img src=x onerror='${PWN}'>"] --> B["<script>${PWN}</script>"]\n  click A href "javascript:${PWN}"`),
  'vega-lite: js href': fence('vega-lite', JSON.stringify({ data: { values: [{ a: 1, u: `javascript:${PWN}` }] }, mark: 'point', encoding: { x: { field: 'a', type: 'quantitative' }, href: { field: 'u', type: 'nominal' } } })),
  'abc: markup in title': fence('abc', `X:1\nT:<img src=x onerror=${PWN}>\nK:C\nCDEF|`),
  'math: raw HTML package': `$\\require{texhtml}\\text{<tex-html><img src=x onerror="${PWN}"></tex-html>}$ and $\\require{setoptions}\\setOptions{tex}{x}$`,
  'math: href and attributes': `$\\href{javascript:${PWN}}{x}$ and $\\href{x" tabindex="0" autofocus onfocus="${PWN}}{y}$ and $\\style{color:red" onfocus="${PWN}}{z}$`,
}
const failing = {
  'vega-lite: remote data refused': [fence('vega-lite', '{"data":{"url":"https://example.com/data.json"},"mark":"point"}'), /remote data/],
  'mermaid: syntax error': [fence('mermaid', 'flowchart LR\n  A -->'), /./],
  'dot: syntax error': [fence('dot', 'digraph { a -> }'), /./],
  'vega-lite: bad JSON': [fence('vega-lite', '{nope'), /JSON/],
  'smiles: not a molecule': [fence('smiles', 'C1CC('), /./],
  'svg: not an svg': [fence('svg', '<p>hello</p>'), /nothing to draw/],
}

let bad = 0
const check = (name, ok, note = '') => (ok || bad++, console.log(ok ? '  ok  ' : '  FAIL', name, note))
const paint = src => page.evaluate(async src => {
  const node = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'e2e' }))
  node.innerHTML = window.md.render(src)
  await window.md.latexPlus.hydrate(node)
  await new Promise(r => setTimeout(r, 300))
  const all = [...node.querySelectorAll('*')]
  return {
    pending: node.querySelectorAll('.mlp-pending').length, errors: [...node.querySelectorAll('.mlp-error')].map(e => e.querySelector('.mlp-msg')?.textContent ?? e.title),
    drawn: node.querySelectorAll('.mlp svg').length, pwned: !!window.__pwned,
    handlers: all.flatMap(e => [...e.attributes].filter(a => /^on/i.test(a.name)).map(a => `${e.tagName}.${a.name}`)),
    links: all.flatMap(e => [...e.attributes].filter(a => /^\s*javascript:/i.test(a.value) && a.name !== 'title').map(a => `${e.tagName}.${a.name}`)),
    // Mermaid cleans its own HTML labels (strict mode): an <img> may stay there, code may not.
    tags: all.filter(e => /^(script|iframe|object|embed)$/i.test(e.tagName) || (e.tagName === 'IMG' && !e.closest('.mlp-mermaid'))).map(e => e.tagName),
    stray: document.querySelectorAll('body > [id^="dmlp-mermaid"], body > svg[id^="mlp-mermaid"]').length,
  }
}, src)

console.log('hostile input')
for (const [name, src] of Object.entries(hostile)) {
  const r = await paint(src)
  check(name, !r.pwned && !r.handlers.length && !r.links.length && !r.tags.length && !r.pending, JSON.stringify({ drawn: r.drawn, errors: r.errors.length, ...r.handlers.length && { handlers: r.handlers }, ...r.links.length && { links: r.links }, ...r.tags.length && { tags: r.tags } }))
}
console.log('errors are shown, not thrown')
for (const [name, [src, re]] of Object.entries(failing)) {
  const r = await paint(src)
  check(name, r.errors.length === 1 && re.test(r.errors[0]) && !r.stray && !r.pending, r.errors[0]?.slice(0, 70))
}

console.log('tikz input forms')
const tikz = {
  'a whole document': String.raw`\documentclass[tikz]{standalone}
\usepackage{pgfplots}
\usepackage{siunitx}
\pgfplotsset{compat=1.16}
\begin{document}
\begin{tikzpicture}\begin{axis}[width=6cm,height=4cm]\addplot[domain=0:2]{x^2};\end{axis}\end{tikzpicture}
\end{document}`,
  'a tikz library': String.raw`\usetikzlibrary{arrows.meta, calc}
\begin{tikzpicture}\draw[-{Stealth[length=3mm]}] (0,0) -- ($(2,0)!0.5!(2,2)$);\end{tikzpicture}`,
  'tikz-3dplot': String.raw`\tdplotsetmaincoords{60}{110}
\begin{tikzpicture}[tdplot_main_coords]\draw[->] (0,0,0) -- (1,0,0) node[below]{$x$};\draw[->] (0,0,0) -- (0,1,0) node[right]{$y$};\draw[->] (0,0,0) -- (0,0,1) node[above]{$z$};\end{tikzpicture}`,
  'math inside nodes': String.raw`\begin{tikzpicture}\node[draw] {$\displaystyle \int_0^1 x^2\,dx = \tfrac{1}{3}$ and $\mathbb{R}$};\end{tikzpicture}`,
}
for (const [name, body] of Object.entries(tikz)) {
  const r = await paint(fence('tikz', body))
  check(name, r.drawn === 1 && !r.errors.length, r.errors[0] ?? '')
}
const texError = await paint(fence('tikz', String.raw`\begin{tikzpicture}\draw (0,0) -- \undefinedmacro;\end{tikzpicture}`))
check('a TeX error is reported', texError.errors.length === 1 && !texError.pending, texError.errors[0])

console.log('streaming')
const s = await page.evaluate(async () => {
  const { md } = window, node = document.body.appendChild(document.createElement('div'))
  const text = 'Energy is $E=mc^2$ and\n\n$$\n\\int_0^1 x^2\\,dx = \\tfrac13\n$$\n\n```dot\ndigraph { stream -> render }\n```\n\ndone $a_1+b_2$.'
  let flicker = 0, seen = new Set
  for (let i = 1; i <= text.length; i += 3) {
    node.innerHTML = md.render(text.slice(0, i))
    // anything finished in an earlier frame must come back finished, straight from the cache
    for (const e of node.querySelectorAll('.mlp-pending')) seen.has(e.dataset.mlp + e.textContent) && flicker++
    await md.latexPlus.hydrate(node)
    for (const e of node.querySelectorAll('.mlp:not(.mlp-pending)')) seen.add(e.dataset.mlp + (e.dataset.src ?? ''))
  }
  node.innerHTML = md.render(text)
  const sync = node.querySelectorAll('.mlp-pending').length
  await md.latexPlus.hydrate(node)
  return { sync, left: node.querySelectorAll('.mlp-pending, .mlp-error').length, math: node.querySelectorAll('.mlp-math svg').length, figure: node.querySelectorAll('.mlp-dot svg').length, halfFence: md.render('```dot\ndigraph { a -> ').includes('mlp') }
})
check('final render needs no hydrate', s.sync === 0, JSON.stringify(s))
check('everything drawn', s.left === 0 && s.math >= 3 && s.figure === 1)
check('an unclosed fence stays code', !s.halfFence)
check('no dialogs opened', !dialogs.length, dialogs.join(','))

await browser.close()
console.log(bad ? `${bad} failed` : 'all passed')
process.exit(bad ? 1 : 0)
