// Layout for the wrappers this plugin emits. MathJax's own stylesheet is appended to it at runtime.
export const base = `
.mlp-math mjx-container[jax="SVG"]>svg{display:inline}
.mlp-display{display:block;margin:1em 0;text-align:center;overflow-x:auto;overflow-y:hidden}
.mlp-display mjx-container[jax="SVG"][display="true"]{margin:0}
.mlp-pending,.mlp-error{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em;white-space:pre-wrap}
.mlp-pending{opacity:.6}
.mlp-math.mlp-error{text-decoration:underline wavy #c8372d;text-underline-offset:3px}
.mlp-block{margin:1em 0;padding:14px;border-radius:10px;background:#fff;color:#111;text-align:center;overflow-x:auto}
.mlp-block>svg{max-width:100%;height:auto}
.mlp-tikz{padding:22px 14px}
.mlp-tikz svg{overflow:visible}
.mlp-svg>svg,.mlp-abc>svg{max-height:26em}
.mlp-block.mlp-pending,.mlp-block.mlp-error{padding:0;background:none;color:inherit;text-align:left}
.mlp-block pre{margin:0}
.mlp-msg{margin:.4em 0 0;font:500 .85em system-ui,sans-serif;color:#c8372d}
`
