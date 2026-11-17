# Security

The plugin is meant for text you did not write: model replies, shared threads, user posts. The rule it follows is that **source text can only ever become a formula or a figure, never markup or code**.

## What is done

**Math.** MathJax runs with its `safe` extension, which drops `javascript:` and other unsafe URLs from `\href`, and filters `\class`, `\cssId`, `\style` and `\data`. The `texhtml` and `setoptions` packages cannot be loaded with `\require`. Output is serialised by MathJax with attribute values escaped, and nothing from the source is ever concatenated into HTML by this plugin without escaping.

**Figures.** Every renderer's SVG goes through [DOMPurify](https://github.com/cure53/DOMPurify) (SVG profile) before it is cached or inserted: scripts, event handlers, `javascript:` URLs, `foreignObject` HTML and anything else outside the SVG allow-list are removed. Element ids are rewritten per figure so one figure cannot restyle or clip another.

**Mermaid** is the exception to the DOMPurify pass, because its HTML labels would be stripped. It runs with `securityLevel: 'strict'`, in which Mermaid sanitises labels itself and disables click handlers.

**Charts.** A Vega-Lite spec cannot load data, images or anything else from a URL: the loader refuses every request and the block reports an error. Supply your own loader if you want remote data.

**TikZ.** TeX runs inside a WebAssembly sandbox in a worker. The only files it can read are the TeX packages served with the engine, and its SVG output is sanitised like every other figure.

**Placeholders and errors** contain the source as escaped text only.

## What is not done

- **Images in Mermaid labels.** Mermaid's strict mode allows `<img>` in a label, so a diagram can make the browser request an image URL. Markdown images can do the same.
- **Links.** `\href{https://…}` in math and links in SVG produce ordinary links to `http(s)` URLs.
- **Resource use.** A figure can be expensive to draw. TikZ has a time limit (`tikz.timeout`, 90 s by default); the other renderers do not.
- **Your own renderers.** HTML returned by a function in `renderers` is inserted as is.
- **markdown-it itself.** Keep `html: false` (the default) for untrusted text.

## How it is tested

- `test/plugin.test.js` renders a set of hostile formulas in Node and inspects the parsed result for event handlers, script URLs, injected attributes, ids and classes.
- `scripts/e2e.js` does the same in a real browser for math and for each figure renderer, with payloads that set a global if any of them runs, and checks that no dialog opens.

## Reporting a problem

Please open a private security advisory on the GitHub repository rather than a public issue.
