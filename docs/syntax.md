# Syntax

## Math delimiters

| You write | You get |
|---|---|
| `$x^2$` or `\(x^2\)` | inline math |
| `$$x^2$$` or `\[x^2\]` | display math, on its own lines or in the middle of a sentence |
| `\begin{align} … \end{align}` on its own lines | display math, no delimiters needed |

Bare environments that are picked up: `equation`, `align`, `alignat`, `flalign`, `gather`, `multline`, `eqnarray`, `displaymath`, `prooftree`, `CD` (and their starred forms). A bare `tikzpicture`, `tikzcd` or `circuitikz` goes to the TikZ engine. Turn this off with `environments: false`.

Pick the delimiters you want with `delimiters: 'all' | 'dollars' | 'brackets'`.

## When a dollar is not math

The rules are the ones Pandoc uses, so ordinary prose survives:

- An opening `$` must be followed directly by a non-space character.
- A closing `$` must follow a non-space character and must not be followed by a digit.
- `\$` is always a literal dollar.

So `costs $5 and $10`, `$5-$10` and `a $ b $ c` stay as text, while `$5$` is math. Math inside code spans and code blocks is never touched.

## Display math in the flow of a document

Display blocks may interrupt a paragraph (no blank line needed), sit inside lists and blockquotes, and contain blank lines or lines that would otherwise start a list:

```md
- The result is
  $$
  a = b
  - c
  $$
```

A block that has not been closed yet is left as text, which is what you want while a reply is still streaming.

## Packages

Loaded up front: `ams`, `mathtools`, `enclose`, `colortbl`, `cases`, `empheq`, `upgreek`, `centernot`, `gensymb`, `textcomp`, `units`, `begingroup`, and in the browser `xypic`.

Loaded by MathJax the first time one of their commands appears: `mhchem`, `cancel`, `color`, `braket`, `bussproofs`, `amscd`, `bbox`, `boldsymbol`, `extpfeil`, `html`, `unicode`, `verb`, `action`, `bbm`, `dsfont`.

`physics` is left out because it redefines common commands such as `\div`. Add it with `packages: ['physics']`, or per formula with `\require{physics}`.

Define your own commands once for every formula:

```js
md.use(latexPlus, { macros: { RR: '\\mathbb{R}', bra: ['\\langle #1 |', 1] } })
```

## Errors

A formula MathJax cannot parse is shown as its source, underlined, with the reason in the `title`. An unknown command inside an otherwise valid formula is printed in red by MathJax and the rest still renders.

## Limits

- **Each formula is typeset on its own.** `\label` and `\eqref` work inside one formula; a reference to a label in another formula does not resolve, and equations are not numbered automatically.
- **Pipes in tables.** markdown-it splits table cells on `|` before math is parsed. Inside a table write `\vert` or `\lvert … \rvert` instead of `|`.
- **xy-pic on the server.** The xy-pic extension is loaded in the browser only.
- **This is math-mode LaTeX.** `\section`, `\usepackage` and other document commands are not math. For pictures, plots and tables use a [`tikz` block](figures.md#tikz).
