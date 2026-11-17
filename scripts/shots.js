// Draw every example on the site in a real browser, report what failed, and save the images used
// by the README (docs/img) and the site's link preview (site/public/og.png).
//   node scripts/shots.js [url]        (default http://localhost:5173, i.e. `npm run dev` in site/)
// Set CHROME to a Chromium binary if Playwright's own download is not installed.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:5173', at = p => new URL(p, import.meta.url).pathname, out = at('../docs/img/')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' })
const problems = []
page.on('pageerror', e => problems.push(`page error: ${String(e).slice(0, 200)}`))
page.on('console', m => m.type() === 'error' && !/invalid\.site|favicon|ERR_NAME_NOT_RESOLVED/.test(m.text()) && problems.push(`console: ${m.text().slice(0, 200)}`))

const settle = async (p, scope = '') => {
  await p.waitForFunction(s => !document.querySelector(`${s} .mlp-pending`), scope, { timeout: 240000 }).catch(() => problems.push('timed out with figures still pending'))
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(500)
}
const t = Date.now()
await page.goto(url, { waitUntil: 'load' })
await page.evaluate(() => window.drawAll())
await settle(page)

const cards = await page.evaluate(() => [...document.querySelectorAll('.card')].map(c => ({
  id: c.id.slice(3),
  state: c.querySelector('.mlp-error') ? `ERROR ${c.querySelector('.mlp-msg')?.textContent ?? c.querySelector('.mlp-error').title}` : c.querySelector('.mlp-pending') ? 'PENDING' : c.querySelector('.out svg') ? 'ok' : 'EMPTY',
})))
for (const c of cards) console.log(c.id.padEnd(10), c.state)
console.log(`${cards.filter(c => c.state === 'ok').length}/${cards.length} drawn in ${((Date.now() - t) / 1000).toFixed(1)} s`)

await (await page.$('#glance')).screenshot({ path: out + 'glance.png' })
for (const id of ['latex', 'tikz', 'figures']) {
  const clip = await page.evaluate(id => { const r = document.getElementById(id).nextElementSibling.nextElementSibling.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height } }, id)
  await page.screenshot({ path: `${out}${id}.png`, clip, fullPage: true })
}

const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' })
await og.goto(url, { waitUntil: 'load' })
await settle(og, '#glance')
await og.screenshot({ path: at('../site/public/og.png') })

problems.forEach(p => console.log('!', p))
await browser.close()
process.exit(cards.every(c => c.state === 'ok') && !problems.length ? 0 : 1)
