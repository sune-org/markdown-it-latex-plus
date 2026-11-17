// markdown-it rules for math: $…$ and \(…\) inline, $$…$$ and \[…\] display,
// plus bare \begin{env}…\end{env} blocks written without any delimiter.
const ENV = /^\\begin\{((?:equation|align|alignat|flalign|gather|multline|eqnarray|displaymath|prooftree|CD)\*?|tikzpicture|tikzcd|circuitikz)\}/
const TIKZ = /^(tikz|circuitikz)/

// True when the delimiter at i sits behind an odd run of backslashes.
const escaped = (s, i) => { let n = 0; while (s[--i] === '\\') n++; return n & 1 }
const find = (s, close, i) => { for (; (i = s.indexOf(close, i)) >= 0; i += close.length) if (!escaped(s, i)) return i; return -1 }

export const inline = d => (state, silent) => {
  const s = state.src, p = state.pos, c = s[p], n = s[p + 1]
  let open, close, display
  if (c === '$' && d.dollars) display = n === '$', open = close = display ? '$$' : '$'
  else if (c === '\\' && (n === '(' || n === '[') && d.brackets) display = n === '[', open = c + n, close = display ? '\\]' : '\\)'
  else return false
  const a = p + open.length
  // A lone $ opens math only when text follows it directly, which keeps "$5 and $10" as prose.
  if (open === '$' && (!s[a] || /\s/.test(s[a]))) return false
  let e = find(s, close, a)
  // ...and closes only after text and never right before a digit.
  if (open === '$' && e >= 0 && (/\s/.test(s[e - 1]) || /\d/.test(s[e + 1] ?? ''))) e = -1
  if (e < 0 || e >= state.posMax || !s.slice(a, e).trim()) {
    if (open !== '$$') return false
    if (!silent) state.pending += open
    state.pos = a
    return true
  }
  if (!silent) Object.assign(state.push('math_inline', 'math', 0), { markup: open, content: s.slice(a, e), meta: { display } })
  state.pos = e + close.length
  return true
}

export const block = (d, envs) => (state, start, end, silent) => {
  if (state.sCount[start] - state.blkIndent >= 4) return false
  const { src, bMarks, eMarks, tShift, sCount } = state
  const text = l => src.slice(bMarks[l] + tShift[l], eMarks[l]).trimEnd(), first = text(start)
  let open, close, m
  if (d.dollars && first.startsWith('$$')) open = close = '$$'
  else if (d.brackets && first.startsWith('\\[')) open = '\\[', close = '\\]'
  else if (envs && (m = first.match(ENV))) open = '', close = `\\end{${m[1]}}`
  else return false
  // The closing delimiter must end a line: this one, or a later one in the same container.
  let last = start
  if (!(first.endsWith(close) && first.length >= open.length + close.length))
    for (last++; ; last++) {
      if (last >= end || (bMarks[last] + tShift[last] < eMarks[last] && sCount[last] < state.blkIndent)) return false
      if (text(last).endsWith(close)) break
    }
  if (silent) return true
  const keep = m ? close.length : 0, body = last === start
    ? first.slice(open.length, first.length - close.length + keep)
    : [first.slice(open.length), state.getLines(start + 1, last, sCount[start], false), text(last).slice(0, text(last).length - close.length + keep)].join('\n')
  const tikz = m && TIKZ.test(m[1])
  Object.assign(state.push(tikz ? 'mlp_block' : 'math_block', 'math', 0), {
    block: true, content: body.trim(), map: [start, last + 1], markup: open || m[0], meta: { kind: tikz ? 'tikz' : 'math' },
  })
  state.line = last + 1
  return true
}

// A fence still being typed (no closing line yet) is left as an ordinary code block.
export const closed = (t, lines) => new RegExp(`^[\\s>]*${t.markup[0] === '`' ? '`' : '~'}{${t.markup.length},}\\s*$`).test(lines[t.map[1] - 1] ?? '') && t.map[1] - t.map[0] > 1
