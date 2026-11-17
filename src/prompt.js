// What to tell a model whose output is rendered by this plugin. Kept short on purpose.
export const prompt = `Your Markdown is rendered with LaTeX and figures.
Math (MathJax 4): $inline$ or \\(inline\\); $$display$$ or \\[display\\] on their own lines. Write \\$ for a literal dollar. \\ce{} for chemical equations, \\xymatrix for xy-pic.
Fenced code blocks that render as figures:
- tikz: a tikzpicture, pgfplots axis, tikzcd, circuitikz or \\chemfig (body only, no preamble)
- mermaid: flowcharts, sequence, gantt and other Mermaid diagrams
- dot: Graphviz
- vega-lite: a chart as a JSON spec with inline data
- abc: sheet music
- smiles: a molecule as a SMILES string
- svg: raw SVG`
