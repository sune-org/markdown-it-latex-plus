// Quickest possible check that the package loads and typesets: node test/smoke.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'
import latexPlus from 'markdown-it-latex-plus'

test('smoke: one formula, through the package entry point', async () => {
  const md = MarkdownIt().use(latexPlus)
  assert.match(md.render('$x$'), /mlp-pending/)
  assert.match(await md.latexPlus.render('Euler: $e^{i\\pi}+1=0$'), /<svg/)
})
