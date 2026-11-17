# API

```js
import latexPlus, { hydrate, runtime, prompt, tikzdoc } from 'markdown-it-latex-plus'
```

## How rendering works

markdown-it is synchronous; MathJax fonts, TeX and the diagram libraries are not. So the plugin keeps a cache and splits the work in two:

1. `md.render(text)` returns immediately. Anything already in the cache comes out finished. Math is typeset on the spot once MathJax has loaded. Everything else becomes a placeholder: the source, in a `span` or `div` with the class `mlp-pending`.
2. `md.latexPlus.hydrate(node)` renders the placeholders under `node`, replaces them, and stores the results in the cache.

The cache is keyed by the source text, so the same formula or figure is only ever rendered once, however many times the page is re-rendered.

## `md.use(latexPlus, options)`

| Option | Default | |
|---|---|---|
| `delimiters` | `'all'` | `'all'`, `'dollars'` or `'brackets'` |
| `environments` | `true` | render bare `\begin{align}…\end{align}` blocks |
| `blocks` | all on | `{ mermaid: false }` switches a fence off |
| `packages` | `[]` | extra MathJax TeX packages, e.g. `['physics']` |
| `macros` | `{}` | predefined TeX macros |
| `mathjax` | `{}` | merged over the MathJax configuration |
| `xypic` | `true` | load xy-pic with MathJax (browser) |
| `cdn` | `https://cdn.jsdelivr.net/` | where libraries are fetched from |
| `libs` | `{}` | loaders that replace the CDN copy of a library |
| `tikz` | | `{ base, timeout }` |
| `mermaid`, `dot`, `abc`, `smiles` | | passed to that library |
| `vega` | | `{ loader }` replaces the loader that refuses remote data |
| `renderers` | `{}` | [your own fenced blocks](figures.md#your-own-blocks) |
| `cache` | `500` | entries kept |
| `css` | `true` | inject the stylesheet automatically |

## `md.latexPlus`

| | |
|---|---|
| `ready()` | Loads MathJax. Afterwards `md.render()` typesets math synchronously. |
| `hydrate(root = document)` | Renders every placeholder under `root`. Returns a promise. Safe to call as often as you like. |
| `render(src, env)` | Async render: resolves with HTML in which everything this environment can typeset is finished. |
| `css()` | The stylesheet, including MathJax's once it is loaded. |
| `cache` | The `Map` of rendered results. `cache.clear()` empties it. |
| `options` | The resolved options. |

## Streaming chat

```js
const md = MarkdownIt().use(latexPlus)
md.latexPlus.ready()                    // optional: start loading MathJax early

function paint(node, text) {            // call for every chunk
  node.innerHTML = md.render(text)
  md.latexPlus.hydrate(node)
}
```

Because finished work is served from the cache synchronously, replacing `innerHTML` on every chunk does not make formulas or figures flash. A fence is only handed to its renderer once it is closed.

## Server rendering

```js
import MarkdownIt from 'markdown-it'
import latexPlus from 'markdown-it-latex-plus'

const md = MarkdownIt().use(latexPlus)
const html = await md.latexPlus.render(source)   // math is finished SVG
const css = md.latexPlus.css()                   // ship this with the page
```

Figures need a browser, so they arrive as placeholders. On the client:

```js
import { hydrate } from 'markdown-it-latex-plus'
hydrate()                 // or hydrate(element, options)
```

`hydrate` uses the options of the last plugin instance created on the page, or the defaults if there is none.

## Bringing your own libraries

By default each library is loaded from jsDelivr at a pinned version. To bundle or self-host instead:

```js
md.use(latexPlus, {
  libs: {
    mermaid: () => import('mermaid'),
    dompurify: () => import('dompurify'),
  },
  cdn: 'https://my-mirror.example/',        // or move everything at once
  tikz: { base: '/vendor/tikzjax/' },       // see engines.md
  mathjax: { /* any MathJax configuration */ },
})
```

A loader may return the module, its default export, or the library's global object. If the page has already loaded MathJax 4, the plugin uses that copy as it is.

## Styling

The output uses a small set of classes:

| Class | On |
|---|---|
| `mlp` | every wrapper |
| `mlp-math`, `mlp-display` | math, and display math |
| `mlp-block`, `mlp-tikz`, `mlp-mermaid`, … | figures |
| `mlp-pending` | a placeholder waiting for `hydrate()` |
| `mlp-error` | something that could not be rendered |
| `mlp-msg` | the reason, under a failed figure |

Figures sit on a white card so they stay legible on dark pages; override `.mlp-block` to change that. Pass `css: false` and include `md.latexPlus.css()` yourself if you manage styles centrally.

## Other exports

- `prompt`: the text to give a model, as shown in the README.
- `runtime(options)`: a renderer without a markdown-it instance (`hydrate`, `ready`, `css`).
- `tikzdoc(source)`: how a TikZ block is split into body, packages, libraries and preamble.
