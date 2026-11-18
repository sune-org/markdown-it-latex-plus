// Every example is plain Markdown, exactly as a person or a model would write it.
const r = String.raw, fence = (lang, body) => '```' + lang + '\n' + body.trim() + '\n```'

export const examples = [
  { id: 'inline', group: 'latex', title: 'Inline and display', md: r`The Gaussian integral $\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}$ sits in a sentence, and \(e^{i\pi} + 1 = 0\) works too. A price like $5 stays a price.

$$
\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} = \prod_{p \text{ prime}} \frac{1}{1 - p^{-s}}
$$` },
  { id: 'align', group: 'latex', title: 'Bare environments', md: r`\begin{align}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} & \nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} & \nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{align}` },
  { id: 'matrix', group: 'latex', title: 'Matrices and cases', md: r`\[
A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}, \qquad
\det A = ad - bc, \qquad
|x| = \begin{cases} x & x \ge 0 \\ -x & x < 0 \end{cases}
\]` },
  { id: 'chem', group: 'latex', title: 'Chemistry with mhchem', md: r`$$\ce{Zn^2+ <=>[+ 2OH-][+ 2H+] Zn(OH)2 v <=>[+ 2OH-][+ 2H+] [Zn(OH)4]^2-}$$

Combustion is $\ce{CH4 + 2O2 -> CO2 + 2H2O}$, and $\ce{^{227}_{90}Th+}$ is an isotope.` },
  { id: 'proof', group: 'latex', title: 'Proof trees', md: r`\begin{prooftree}
\AxiomC{$A$} \AxiomC{$A \to B$} \RightLabel{$\to$E} \BinaryInfC{$B$}
\AxiomC{$B \to C$} \RightLabel{$\to$E} \BinaryInfC{$C$}
\end{prooftree}` },
  { id: 'xypic', group: 'latex', title: 'xy-pic diagrams', md: r`$$
\xymatrix@C=3pc@R=2pc{
U \ar@/_/[ddr]_y \ar@{.>}[dr]|-{(x,y)} \ar@/^/[drr]^x \\
& X \times_Z Y \ar[d]^q \ar[r]_p & X \ar[d]_f \\
& Y \ar[r]^g & Z }
$$` },
  { id: 'boxes', group: 'latex', title: 'Colour, boxes and cancelling', md: r`$$
\bbox[#fff3b0, 6px, border: 2px solid #e63946]{E = mc^2} \qquad
\frac{\cancel{(x-1)}\,(x+2)}{\cancel{(x-1)}} \qquad
\begin{array}{|l|r|}\hline \rowcolor{#ffd166} \text{Engine} & \text{KB} \\ \hline \text{KaTeX} & 80 \\ \hline \text{Temml} & \cellcolor{#8ecae6} 50 \\ \hline \end{array}
$$` },

  { id: 'tikz', group: 'tikz', title: 'TikZ picture', md: fence('tikz', r`
\begin{tikzpicture}[scale=2.2]
  \draw[->] (-1.25,0) -- (1.35,0) node[right] {$x$};
  \draw[->] (0,-1.25) -- (0,1.35) node[above] {$y$};
  \draw (0,0) circle (1);
  \draw[very thick, blue] (0,0) -- (40:1) node[midway, above left] {$1$};
  \draw[very thick, red] (40:1) -- ({cos(40)},0) node[midway, right] {$\sin\theta$};
  \draw[very thick, orange] (0,0) -- ({cos(40)},0) node[midway, below] {$\cos\theta$};
  \draw (0.3,0) arc (0:40:0.3) node[midway, right] {$\theta$};
  \fill (40:1) circle (0.03);
\end{tikzpicture}`) },
  { id: 'plot', group: 'tikz', title: 'pgfplots: function plot', md: fence('tikz', r`
\begin{tikzpicture}
\begin{axis}[width=9cm, height=5.6cm, xlabel={$x$}, ylabel={$f(x)$}, grid=major, legend pos=north west, domain=-3:3, samples=60]
  \addplot[blue, thick] {exp(-x^2)};
  \addplot[red, thick, dashed] {x^2/6};
  \legend{$e^{-x^2}$, $x^2/6$}
\end{axis}
\end{tikzpicture}`) },
  { id: 'bars', group: 'tikz', title: 'pgfplots: bar chart', md: fence('tikz', r`
\begin{tikzpicture}
\begin{axis}[ybar, width=9cm, height=5.6cm, bar width=18pt, ymin=0, ymax=115, ylabel={Score}, symbolic x coords={Q1, Q2, Q3, Q4}, xtick=data, nodes near coords, enlarge x limits=0.2]
  \addplot[fill=blue!55, draw=blue!70!black] coordinates {(Q1,42) (Q2,68) (Q3,55) (Q4,97)};
\end{axis}
\end{tikzpicture}`) },
  { id: 'cd', group: 'tikz', title: 'tikz-cd', md: fence('tikz', r`
\begin{tikzcd}[row sep=large, column sep=large]
  U \arrow[drr, bend left, "x"] \arrow[ddr, bend right, "y"'] \arrow[dr, dashed, "{(x,y)}" description] & & \\
  & X \times_Z Y \arrow[r, "p"] \arrow[d, "q"'] & X \arrow[d, "f"] \\
  & Y \arrow[r, "g"'] & Z
\end{tikzcd}`) },
  { id: 'circuit', group: 'tikz', title: 'circuitikz', md: fence('tikz', r`
\begin{circuitikz}
  \draw (0,0) to[V, v=$V_s$] (0,3) to[R, l=$R_1$] (3,3) to[C, l=$C$] (3,0) -- (0,0);
  \draw (3,3) to[R, l=$R_2$] (6,3) to[L, l=$L$] (6,0) -- (3,0);
\end{circuitikz}`) },
  { id: 'chemfig', group: 'tikz', title: 'chemfig: amphetamine', md: fence('tikz', r`
\chemfig{*6(=-=(-[:30]-[:-30](-[6]NH_2)-[:30])-=-)}`) },
  { id: 'surface', group: 'tikz', title: 'pgfplots: 3D surface', md: fence('tikz', r`
\begin{tikzpicture}
\begin{axis}[width=9cm, height=6.4cm, view={45}{35}, xlabel=$x$, ylabel=$y$]
  \addplot3[mesh, domain=-2:2, samples=16, blue!70!black] {exp(-x^2-y^2)};
\end{axis}
\end{tikzpicture}`) },
  { id: 'table', group: 'tikz', title: 'tabular', md: fence('tikz', r`
\begin{tabular}{l|r|r}
  \textbf{Planet} & \textbf{Moons} & \textbf{Day (h)} \\ \hline
  Earth & 1 & 24.0 \\
  Mars & 2 & 24.6 \\
  Jupiter & 95 & 9.9
\end{tabular}`) },

  { id: 'mermaid', group: 'figures', title: 'Mermaid flowchart', md: fence('mermaid', `
flowchart LR
  U[User message] --> M{Has math?}
  M -- yes --> L[Load engine]
  M -- no --> R[Render markdown]
  L --> R
  R --> S[(Save thread)]`) },
  { id: 'sequence', group: 'figures', title: 'Mermaid sequence', md: fence('mermaid', `
sequenceDiagram
  participant App
  participant Plugin
  participant Engine
  App->>Plugin: md.render(text)
  Plugin-->>App: HTML with placeholders
  App->>Plugin: hydrate(node)
  Plugin->>Engine: load on first use
  Engine-->>Plugin: SVG
  Plugin-->>App: figure in place`) },
  { id: 'dot', group: 'figures', title: 'Graphviz', md: fence('dot', `
digraph G {
  rankdir=LR; nodesep=0.6
  node [shape=box, style=rounded, fontname="Helvetica"]
  parse -> tokens -> render
  tokens -> math -> render
  tokens -> figure -> render
}`) },
  { id: 'vega', group: 'figures', title: 'Vega-Lite chart', md: fence('vega-lite', `
{
  "width": 380, "height": 200,
  "data": {"values": [
    {"month": "Jan", "city": "Oslo", "temp": -3}, {"month": "Apr", "city": "Oslo", "temp": 6},
    {"month": "Jul", "city": "Oslo", "temp": 18}, {"month": "Oct", "city": "Oslo", "temp": 7},
    {"month": "Jan", "city": "Cairo", "temp": 14}, {"month": "Apr", "city": "Cairo", "temp": 22},
    {"month": "Jul", "city": "Cairo", "temp": 29}, {"month": "Oct", "city": "Cairo", "temp": 24}]},
  "mark": {"type": "line", "point": true},
  "encoding": {
    "x": {"field": "month", "type": "ordinal", "sort": null, "axis": {"labelAngle": 0, "title": null}},
    "y": {"field": "temp", "type": "quantitative", "title": "Mean temperature (°C)"},
    "color": {"field": "city", "title": null}
  }
}`) },
  { id: 'abc', group: 'figures', title: 'Sheet music', md: fence('abc', `
X:1
T:Ode to Joy
M:4/4
L:1/4
K:C
E E F G | G F E D | C C D E | E3/2 D/2 D2 |`) },
  { id: 'smiles', group: 'figures', title: 'Molecule from SMILES: amphetamine', md: fence('smiles', 'CC(N)Cc1ccccc1') },
  { id: 'svg', group: 'figures', title: 'Raw SVG, sanitised', md: fence('svg', `
<svg viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" x2="1">
    <stop offset="0" stop-color="#7b61ff"/><stop offset="1" stop-color="#ff6b6b"/>
  </linearGradient></defs>
  <rect x="10" y="10" width="200" height="100" rx="16" fill="url(#g)" onclick="alert(1)"/>
  <circle cx="60" cy="60" r="26" fill="#fff" opacity=".9"/>
  <path d="M100 78 L125 40 L150 66 L175 34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
  <script>alert(2)</script>
</svg>`) },
]

export const playground = r`# Try it

Euler's identity $e^{i\pi} + 1 = 0$ inline, and a display equation:

$$
\int_0^\infty \frac{\sin x}{x}\,dx = \frac{\pi}{2}
$$

` + fence('tikz', r`
\begin{tikzpicture}
\begin{axis}[width=8cm, height=5cm, grid=major, domain=0:6.28, samples=60]
  \addplot[blue, thick] {sin(deg(x))};
  \addplot[red, thick] {cos(deg(x))};
\end{axis}
\end{tikzpicture}`) + '\n\n' + fence('mermaid', `
flowchart LR
  A[Write Markdown] --> B[Plugin] --> C[Rendered page]`) + '\n'
