import { config, engine } from './mathcfg.js'

export const { load, ok, css, sync, render } = engine(async o => {
  const m = await import('mathjax'), mj = m.default ?? m, c = config(o)
  c.loader.load.unshift('input/tex', 'output/svg')
  await mj.init(c)
  return mj
})
