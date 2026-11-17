// Turn whatever a model wrote in a tikz block (a bare picture, or a whole document) into what the
// TeX engine needs: a body, the packages to load, TikZ libraries and extra preamble.
const KNOWN = ['amsmath', 'amssymb', 'amsfonts', 'amstext', 'array', 'pgfplots', 'tikz-cd', 'tikz-3dplot', 'chemfig', 'circuitikz', 'etoolbox', 'xparse', 'hf-tikz']
const NEEDS = [
  ['pgfplots', /\\begin\{(axis|semilog[xy]axis|loglogaxis|polaraxis)\}|\\addplot|\\pgfplotsset/],
  ['tikz-cd', /\\begin\{tikzcd\}/],
  ['circuitikz', /\\begin\{circuitikz\}|\\ctikzset/],
  ['chemfig', /\\chemfig|\\schemestart|\\chemname|\\setchemfig/],
  ['tikz-3dplot', /\\tdplot/],
  ['array', /\\begin\{(tabular|array)\}/],
  ['amsmath', /\\(text|dfrac|tfrac|binom|boldsymbol|operatorname)\b|\\begin\{(align|cases|[pbvBV]?matrix)\*?\}/],
  ['amssymb', /\\(mathbb|mathfrak|therefore|because|leqslant|geqslant|nmid|varnothing)\b/],
]

export const tikzdoc = src => {
  const packages = {}, libs = new Set
  let pre = '', body = src.replace(/\\documentclass(\[[^\]]*\])?\{[^}]*\}/g, '')
  const doc = body.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)
  if (doc) pre = body.slice(0, doc.index), body = doc[1]
  // \usepackage and \usetikzlibrary may appear anywhere in model output; both belong to the preamble.
  const lift = s => s
    .replace(/\\usepackage(?:\[([^\]]*)\])?\{([^}]*)\}/g, (_, opt, names) => (names.split(',').map(n => n.trim()).forEach(n => KNOWN.includes(n) && (packages[n] ??= opt ?? '')), ''))
    .replace(/\\usetikzlibrary\{([^}]*)\}/g, (_, l) => (l.split(',').forEach(x => x.trim() && libs.add(x.trim())), ''))
  pre = lift(pre), body = lift(body).trim()
  for (const [name, re] of NEEDS) re.test(pre + body) && (packages[name] ??= '')
  if ('pgfplots' in packages && !/compat\s*=/.test(pre + body)) pre += '\\pgfplotsset{compat=1.16}'
  // The engine only outputs pictures, so plain text such as a tabular goes inside a node.
  if (!/\\begin\{(tikzpicture|tikzcd|circuitikz)\}|\\chemfig|\\schemestart|\\tikz\b/.test(body)) body = `\\begin{tikzpicture}\\node{${body}};\\end{tikzpicture}`
  return { body, packages, libraries: [...libs].join(','), preamble: pre.trim() }
}
