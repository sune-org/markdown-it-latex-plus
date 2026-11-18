import { test } from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import latexPlus, { tikzdoc, prompt } from '../src/index.js'

const md = MarkdownIt({ linkify: true, typographer: true, breaks: true }).use(latexPlus)
const render = s => md.latexPlus.render(s)
const dom = h => new JSDOM(h).window.document
const math = h => dom(h).querySelectorAll('.mlp-math:not(.mlp-error):not(.mlp-pending) svg').length
const count = async (s, n, display) => {
  const h = await render(s)
  assert.equal(dom(h).querySelectorAll(`.mlp-math${display ? '.mlp-display' : ':not(.mlp-display)'}:not(.mlp-error)`).length, n, s)
  n && assert.ok(math(h) >= n, `no svg for ${s}`)
  return h
}

test('inline delimiters', async () => {
  await count('so $x^2$ ok', 1)
  await count('so \\(x^2\\) ok', 1)
  await count('$a$ and $b$ and \\(c\\)', 3)
  await count('a $x$, b', 1)
})

test('display delimiters', async () => {
  await count('text\n\n$$\nx^2\n$$\n\nmore', 1, 1)
  await count('$$x^2$$', 1, 1)
  await count('text\n$$\nx^2\n$$\nmore', 1, 1)
  await count('text\n\\[\nx^2\n\\]\nmore', 1, 1)
  await count('\\[x^2\\]', 1, 1)
  await count('so $$x^2$$ ok', 1, 1)
  await count('so \\[x^2\\] ok', 1, 1)
  await count('$$\na = b\n\n- c\n$$', 1, 1)
})

test('bare environments', async () => {
  await count('intro\n\n\\begin{align}\na &= b \\\\\nc &= d\n\\end{align}\n\nafter', 1, 1)
  await count('\\begin{equation*} E = mc^2 \\end{equation*}', 1, 1)
  const off = MarkdownIt().use(latexPlus, { environments: false })
  assert.match(off.render('\\begin{align}a\\end{align}'), /^<p>/)
})

test('containers', async () => {
  const h = await count('- item\n  $$\n  x^2\n  $$\n- next\n\n> quote $y$\n> $$\n> z\n> $$', 2, 1)
  assert.equal(dom(h).querySelectorAll('li .mlp-display, blockquote .mlp-display').length, 2)
})

test('prose with dollars stays prose', async () => {
  for (const s of ['costs $5 and $10 total', 'I paid $5 (was $10) and $3', 'costs \\$5 and \\$10', 'use `$x$` literally', 'a $ b $ c', '$5-$10', 'so $$\nx^2 + \\frac{a}{'])
    assert.equal(dom(await render(s)).querySelectorAll('.mlp').length, 0, s)
  assert.match(await render('costs \\$5'), /costs \$5/)
})

test('delimiter options', () => {
  const dollars = MarkdownIt().use(latexPlus, { delimiters: 'dollars' }), brackets = MarkdownIt().use(latexPlus, { delimiters: 'brackets' })
  assert.equal(dom(dollars.render('$a$ \\(b\\)')).querySelectorAll('.mlp').length, 1)
  assert.equal(dom(brackets.render('$a$ \\(b\\)')).querySelectorAll('.mlp').length, 1)
})

test('errors keep the source and say why', async () => {
  const e = dom(await render('$\\frac{a}{$')).querySelector('.mlp-error')
  assert.equal(e.textContent, '\\frac{a}{')
  assert.match(e.title, /brace/i)
})

test('labels do not leak between renders', async () => {
  const s = '$$\\begin{equation}a\\label{e}\\end{equation}$$\n\n$$\\begin{equation}b\\label{e}\\end{equation}$$'
  assert.equal(dom(await render(s)).querySelectorAll('.mlp-error').length, 0)
  assert.equal(dom(await render(s + '\n\n$c$')).querySelectorAll('.mlp-error').length, 0)
})

test('packages people expect', async () => {
  const ok = ['\\ce{CO2 + C <=> 2CO}', '\\cancel{x}', '\\mathbbm{1}', '\\mathds{1}', '\\prescript{14}{6}{C}', '\\enclose{circle}{x}', '\\begin{numcases}{|x|=} x & $x\\ge0$ \\\\ -x & $x<0$ \\end{numcases}',
    '\\begin{array}{c}\\rowcolor{yellow} a\\end{array}', '\\upalpha', '\\celsius', '\\nicefrac{1}{2}', '\\bra{\\psi}\\ket{\\phi}', '\\begin{prooftree}\\AxiomC{$A$}\\UnaryInfC{$B$}\\end{prooftree}',
    '\\begin{CD}A @>f>> B\\end{CD}', '\\oiint_S', '\\text{\\texteuro 5}', '\\begin{empheq}[left=\\empheqlbrace]{align}a&=b\\\\c&=d\\end{empheq}', '\\newcolumntype{R}{>{\\color{blue}}r}\\begin{array}{R|c}1&a\\end{array}', '{\\char"41}', '\\bbox[yellow]{x}', '\\begingroup\\def\\x{y}\\x\\endgroup', '\\parbox{3cm}{some text}', '\\require{physics}\\dv{f}{x}']
  for (const t of ok) {
    const h = await render(`$$${t}$$`)
    assert.equal(math(h) > 0 && !/mathcolor="red"|fill="red"/.test(h), true, t)
  }
})

test('sync after ready, placeholders before', async () => {
  const fresh = MarkdownIt().use(latexPlus)
  await fresh.latexPlus.ready()
  assert.equal(math(fresh.render('$q^7$')), 1)
  assert.match(fresh.latexPlus.css(), /mjx-container/)
})

test('fenced blocks', () => {
  const d = dom(md.render('```mermaid\nflowchart LR\n A-->B\n```\n\n```graphviz\ndigraph{a->b}\n```\n\n```js\nlet a = 1\n```\n\n```pgfplots\n\\begin{axis}\\end{axis}\n```'))
  assert.deepEqual([...d.querySelectorAll('.mlp-block')].map(e => e.dataset.mlp), ['mermaid', 'dot', 'tikz'])
  assert.equal(d.querySelector('.mlp-block').textContent, 'flowchart LR\n A-->B')
  assert.equal(d.querySelector('.mlp-block').dataset.src, 'flowchart LR\n A-->B')
  assert.equal(d.querySelectorAll('pre > code.language-js').length, 1)
  // still being typed: plain code until the closing fence arrives
  assert.equal(dom(md.render('```tikz\n\\begin{tikzpicture}\n\\draw (0,0)')).querySelectorAll('.mlp').length, 0)
  assert.equal(dom(md.render('\\begin{tikzpicture}\n\\draw (0,0) circle (1);\n\\end{tikzpicture}')).querySelector('.mlp-block').dataset.mlp, 'tikz')
  assert.equal(dom(MarkdownIt().use(latexPlus, { blocks: { mermaid: false } }).render('```mermaid\nx\n```')).querySelectorAll('.mlp').length, 0)
})

test('hostile TeX cannot add markup', async () => {
  const bad = ['\\href{javascript:alert(1)}{x}', '\\href{x" tabindex="0" autofocus onfocus="alert(1)}{x}', '\\style{color:red" onfocus="alert(1)}{x}',
    '\\style{position:fixed;inset:0;background:url(javascript:alert(1))}{x}', '\\class{fixed inset-0}{x}', '\\cssId{app}{x}', '\\unicode[x" onfocus="alert(1)]{x263a}',
    '\\data{onclick=alert(1)}{x}', '\\mmlToken{mi}[onclick="alert(1)"]{x}', '\\require{texhtml}\\text{<tex-html><img src=x onerror=alert(1)></tex-html>}',
    '\\text{<img src=x onerror=alert(1)><script>alert(1)</script>}', '\\color{red" onfocus="alert(1)}{x}', '\\require{setoptions}\\setOptions{tex}{x}', '\\texttip{x}{" onmouseover="alert(1)}']
  for (const t of bad) {
    const d = dom(await render(`$${t}$`))
    assert.equal(d.querySelectorAll('img, script, iframe, [autofocus], [tabindex], #app, .fixed').length, 0, t)
    for (const e of d.querySelectorAll('*')) for (const a of e.attributes) {
      assert.ok(!/^on/i.test(a.name), `${t} → ${a.name}`)
      assert.ok(a.name === 'title' || !/^\s*javascript:/i.test(a.value), `${t} → ${a.name}=${a.value}`)
      a.name === 'style' && assert.ok(!/position|url\(/i.test(a.value), `${t} → style ${a.value}`)
    }
  }
})

test('tikzdoc finds what a figure needs', () => {
  assert.deepEqual(tikzdoc('\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}'), { body: '\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}', packages: {}, libraries: '', preamble: '' })
  const p = tikzdoc('\\documentclass{standalone}\n\\usepackage{pgfplots}\n\\usepackage{siunitx}\n\\usetikzlibrary{arrows.meta, calc}\n\\begin{document}\n\\begin{tikzpicture}\\begin{axis}\\addplot{x};\\end{axis}\\end{tikzpicture}\n\\end{document}')
  assert.deepEqual(p.packages, { pgfplots: '' })
  assert.equal(p.libraries, 'arrows.meta,calc')
  assert.match(p.preamble, /compat/)
  assert.ok(p.body.startsWith('\\begin{tikzpicture}') && !/document/.test(p.body))
  assert.ok('chemfig' in tikzdoc('\\chemfig{H-O-H}').packages)
  assert.ok('circuitikz' in tikzdoc('\\begin{circuitikz}\\draw (0,0) to[R] (2,0);\\end{circuitikz}').packages)
  assert.ok('tikz-cd' in tikzdoc('\\begin{tikzcd}A \\arrow[r] & B\\end{tikzcd}').packages)
  assert.match(tikzdoc('\\begin{tabular}{l|r}a&b\\end{tabular}').body, /^\\begin\{tikzpicture\}\\node\{/)
})

test('the agent prompt names every block', () => {
  assert.ok(readFileSync(new URL('../docs/README.md', import.meta.url), 'utf8').includes('```\n' + prompt + '\n```'), 'README prompt is out of date')
  for (const k of ['tikz', 'mermaid', 'dot', 'vega-lite', 'abc', 'smiles', 'svg']) assert.match(prompt, new RegExp(`- ${k}:`))
})
