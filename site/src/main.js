import MarkdownIt from 'markdown-it'
import latexPlus, { prompt } from 'markdown-it-latex-plus'
import { groups, examples, playground } from './examples.js'
import './style.css'

// TikZ assets are served by this site, so use them from wherever the page is running.
const md = MarkdownIt({ linkify: true, typographer: true }).use(latexPlus, { tikz: { base: new URL('tikzjax/', document.baseURI).href } })
window.md = md  // handy in the console: md.render('$x$')
const $ = s => document.querySelector(s)
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e }
const paint = (node, src) => (node.innerHTML = md.render(src), md.latexPlus.hydrate(node))

// Figures are drawn as they come near the viewport, so the page opens fast.
const todo = new Map, near = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && draw(e.target)), { rootMargin: '700px' })
const draw = node => { const src = todo.get(node); src && (todo.delete(node), near.unobserve(node), paint(node, src)) }
const later = (node, src) => (todo.set(node, src), near.observe(node), node)
window.drawAll = () => Promise.all([...todo].map(([node, src]) => (todo.delete(node), paint(node, src))))

$('#prompt').textContent = prompt
$('#copy').onclick = async e => {
  await navigator.clipboard.writeText(prompt)
  e.target.textContent = 'Copied'
  setTimeout(() => e.target.textContent = 'Copy', 1400)
}

const pick = id => examples.find(x => x.id === id)
$('#glance').append(...['align', 'plot', 'chemfig', 'sequence', 'circuit', 'vega', 'xypic', 'smiles'].map(id =>
  el('a', { className: 'tile', href: `#ex-${id}`, title: pick(id).title }, later(el('div', { className: 'md' }), pick(id).md))))

$('#gallery').append(...groups.flatMap(g => [
  el('h2', { id: g.id, textContent: g.title }),
  el('p', { className: 'blurb', textContent: g.blurb }),
  el('div', { className: 'cards' }, ...examples.filter(x => x.group === g.id).map(x => el('article', { className: 'card', id: `ex-${x.id}` },
    el('h3', { textContent: x.title }),
    el('pre', { className: 'src' }, el('code', { textContent: x.md })),
    later(el('div', { className: 'out md' }), x.md)))),
]))

const input = $('#input'), output = $('#output')
let timer
input.value = playground
input.oninput = () => (clearTimeout(timer), timer = setTimeout(() => paint(output, input.value), 120))
later(output, playground)
