import type MarkdownIt from 'markdown-it'

export type BlockKind = 'tikz' | 'mermaid' | 'dot' | 'vega-lite' | 'abc' | 'smiles' | 'svg'
export type LibName = 'dompurify' | 'mermaid' | 'viz' | 'vega' | 'vegaLite' | 'abcjs' | 'smiles'

export interface Options {
  /** Which math delimiters to accept. Default `'all'`: `$…$`, `$$…$$`, `\(…\)` and `\[…\]`. */
  delimiters?: 'all' | 'dollars' | 'brackets'
  /** Render bare `\begin{align}…\end{align}` (and friends) without delimiters. Default `true`. */
  environments?: boolean
  /** Switch individual fenced blocks off, e.g. `{ mermaid: false }`. */
  blocks?: Partial<Record<BlockKind, boolean>>
  /** Extra MathJax TeX packages to load up front, e.g. `['physics']`. */
  packages?: string[]
  /** Predefined TeX macros, in MathJax's format: `{ RR: '\\mathbb{R}', bra: ['\\langle #1|', 1] }`. */
  macros?: Record<string, string | [string, number]>
  /** Merged over the MathJax configuration this plugin builds. */
  mathjax?: Record<string, unknown>
  /** Load the xy-pic extension with MathJax in the browser. Default `true`. */
  xypic?: boolean
  /** Base URL the libraries are fetched from in the browser. Default `https://cdn.jsdelivr.net/`. */
  cdn?: string
  /** Supply a library yourself instead of fetching it, e.g. `{ mermaid: () => import('mermaid') }`. */
  libs?: Partial<Record<LibName, () => Promise<unknown>>>
  /** TikZ engine: where its files are served from, and how long one figure may take (ms). */
  tikz?: { base?: string, timeout?: number }
  /** Passed to `mermaid.initialize`. `securityLevel` defaults to `'strict'`. */
  mermaid?: Record<string, unknown>
  /** Passed to Graphviz, e.g. `{ engine: 'neato' }`. */
  dot?: Record<string, unknown>
  /** A Vega loader to use instead of the default one, which refuses every remote request. */
  vega?: { loader?: unknown }
  /** Passed to abcjs `renderAbc`. */
  abc?: Record<string, unknown>
  /** SmilesDrawer options plus `theme` (`'light'` or `'dark'`). */
  smiles?: Record<string, unknown>
  /** Your own fenced blocks: the fence language maps to a function returning trusted HTML. */
  renderers?: Record<string, { render(source: string): string | Promise<string> }>
  /** How many rendered formulas and figures to remember. Default `500`. */
  cache?: number
  /** Inject the stylesheet into the page automatically. Default `true`. */
  css?: boolean
}

export interface Runtime {
  options: Options
  cache: Map<string, { h?: string, e?: string }>
  /** Load MathJax. After this resolves, `md.render()` typesets math synchronously. */
  ready(): Promise<void>
  /** Render every placeholder under `root` (default: the document). Safe to call repeatedly. */
  hydrate(root?: ParentNode): Promise<void>
  /** The stylesheet for the plugin's output, including MathJax's once it has loaded. */
  css(): string
}

export interface LatexPlus extends Runtime {
  /** Render Markdown with everything this environment can typeset finished. */
  render(src: string, env?: unknown): Promise<string>
}

declare module 'markdown-it' {
  interface MarkdownIt { latexPlus: LatexPlus }
}

declare const latexPlus: (md: MarkdownIt, options?: Options) => void
export default latexPlus

/** A standalone runtime, for pages that only hydrate HTML rendered elsewhere. */
export function runtime(options?: Options): Runtime
/** Hydrate with the most recently installed plugin instance, or with `options` if given. */
export function hydrate(root?: ParentNode, options?: Options): Promise<void>
/** What to tell a model whose Markdown is rendered with this plugin. */
export const prompt: string
/** Split TikZ source into the body, packages, libraries and preamble the TeX engine needs. */
export function tikzdoc(source: string): { body: string, packages: Record<string, string>, libraries: string, preamble: string }
