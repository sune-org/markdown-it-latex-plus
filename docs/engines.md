# Engines

The plugin itself is small. Everything heavy is a separate project, fetched in the browser the first time it is needed and never bundled into this package.

| For | Project | Version | Fetched (compressed) | Licence |
|---|---|---|---|---|
| Math | [MathJax](https://www.mathjax.org/) | 4.1.3 | about 0.6 MB, plus fonts and packages as used | Apache-2.0 |
| xy-pic | [XyJax-v4](https://github.com/sonoisa/XyJax-v4) | 4.0.4 | loaded with MathJax | Apache-2.0 |
| `tikz` | [TikZJax](https://github.com/drgrice1/tikzjax) | 1.0.0-beta24 | about 7 MB | GPL-3.0-or-later, TeX files LPPL |
| `mermaid` | [Mermaid](https://mermaid.js.org/) | 12.3.0 | core plus the diagram type used | MIT |
| `dot` | [viz-js](https://github.com/mdaines/viz-js) (Graphviz) | 3.31.0 | about 480 KB | MIT, Graphviz EPL |
| `vega-lite` | [Vega](https://vega.github.io/vega/) and [Vega-Lite](https://vega.github.io/vega-lite/) | 6.4.0, 6.5.0 | about 260 KB | BSD-3-Clause |
| `abc` | [abcjs](https://www.abcjs.net/) | 6.7.2 | about 150 KB | MIT |
| `smiles` | [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) | 2.4.2 | about 60 KB | MIT |
| sanitising | [DOMPurify](https://github.com/cure53/DOMPurify) | 3.4.18 | about 12 KB | Apache-2.0 or MPL-2.0 |

Sizes were measured in November 2026. Versions are pinned in `src/engines.js` and `src/math.browser.js`.

In Node only MathJax is used. It is a normal dependency of this package, together with the font extensions that `mhchem`, `bbm` and `dsfont` need.

## Where things are loaded from

Everything except TikZ comes from `https://cdn.jsdelivr.net/`. Change the host with `cdn`, or replace single libraries with `libs` ([API](api.md#bringing-your-own-libraries)).

## TikZ

TikZJax is TeX itself, compiled to WebAssembly, with a LaTeX format and a set of packages. The stock build has TikZ, pgfplots, tikz-cd, tikz-3dplot, array and the AMS packages. This project adds the TeX files for **chemfig** and **circuitikz** and serves the result from its own site:

```
https://markdown-it-latex-plus.pages.dev/tikzjax/
```

That is the default `tikz.base`. To host it yourself:

```sh
cd site && npm install && node scripts/tikzjax.js    # writes site/public/tikzjax (about 14 MB)
```

Copy that folder to your server and point the plugin at it:

```js
md.use(latexPlus, { tikz: { base: 'https://example.com/tikzjax/' } })
```

Two things your server must do:

- Serve `*.gz` files as plain files (`Content-Type: application/gzip`, no `Content-Encoding`). TikZJax unpacks them itself. Some development servers get this wrong; `site/vite.config.js` shows a fix for Vite.
- Send `Access-Control-Allow-Origin` if the folder is on another origin than your page.

TikZJax is GPL-3.0-or-later. The plugin loads it at runtime as a separate program and does not include it; if you redistribute the folder, keep its `NOTICE.txt`.

### One fix applied to TikZJax output

For some pictures (a `tikzcd` with empty cells, for example) TikZJax wraps parts of the drawing in nested `<svg>` elements whose viewports end up in the wrong place, and the nodes vanish. The plugin turns those nested elements into plain groups, which puts everything where TeX placed it.
