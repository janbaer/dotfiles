import { atom, read, update, type EngineInterface, type Register } from 'claude-code'
import type { Decision, Route } from '../types'

const ROUTER_MODEL = 'typesafe/jev-1.14'
const MIN_CONFIDENCE = 0.6
const TIMEOUT_MS = 3000

type Mode = 'auto' | 'manual'

const route = atom({ plugin: 'model-router', key: 'route' } as const, {
  isDecided: false,
  pending: null,
  suggestion: null,
  model: null,
  base: null,
} as Route)

const family = (model: string) => model.match(/haiku|sonnet|opus|fable/)?.[0] ?? model

async function mode($: EngineInterface): Promise<Mode> {
  return (await $.store.get('mode')) === 'auto' ? 'auto' : 'manual'
}

async function showStatus($: EngineInterface, detail?: string) {
  const { suggestion, isDecided } = await read($, route)
  const parts = [`Modus: ${(await mode($)) === 'auto' ? 'auto' : 'manuell'}`]
  if (isDecided) parts.push(`Vorschlag: ${suggestion ?? 'keiner'}`)
  if (detail) parts.push(detail)
  $.ui.status(parts.join(' · '))
}

async function decide($: EngineInterface, prompt: string): Promise<Decision | null> {
  const key = await $.env.get('OPENROUTER_API_KEY')
  if (!key) return null
  const { instructions, criteria } = JSON.parse(await $.fs.read(`${$.plugin.root}/criteria.json`))
  const request = $.http.fetch('https://openrouter.ai/api/alpha/decisions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ROUTER_MODEL,
      state: prompt,
      questions: { model: { type: 'choice', instructions, criteria } },
    }),
  })
  const res = await Promise.race([request, $.clock.sleep(TIMEOUT_MS).then(() => null)])
  if (!res?.ok) return null
  const answer = JSON.parse(res.text).answers?.model
  return answer?.choice ? { choice: answer.choice, confidence: answer.confidence } : null
}

async function logDecision($: EngineInterface, decision: Decision | null, prompt: string) {
  const line = [
    new Date().toISOString(),
    ROUTER_MODEL,
    decision?.choice ?? 'error',
    decision?.confidence ?? 0,
    prompt.slice(0, 100).replace(/\s+/g, ' '),
  ].join('\t')
  const file = `${await $.env.get('HOME')}/.local/state/claude-model-router/decisions.tsv`
  await $.process.run(['sh', '-c', 'mkdir -p "${1%/*}" && cat >>"$1"', 'sh', file], {
    stdin: `${line}\n`,
  })
}

async function accept($: EngineInterface, decision: Decision, current: string): Promise<boolean> {
  if ((await mode($)) === 'auto') return true
  const target = `Zu ${decision.choice} wechseln`
  const answer = await $.ui
    .ask(
      `Jev schlägt ${decision.choice} statt ${current} vor (Sicherheit ${Math.round(decision.confidence * 100)} %). Für diese Session wechseln?`,
      { options: [target, `Bei ${current} bleiben`], header: 'Model-Router' },
    )
    .catch(() => null)
  return answer === target
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'model-router',
      description: 'Modus des Model-Routers: auto wechselt selbst, manual fragt nach',
      argumentHint: '[auto|manual]',
    })
    await showStatus($)
    return started
  })

  on('command.run', { command: 'model-router' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'auto' || arg === 'manual') {
      await $.store.set('mode', arg)
      await showStatus($)
      return {
        text: arg === 'auto' ? 'Router wechselt das Modell selbst.' : 'Router fragt vor jedem Wechsel nach.',
      }
    }
    return { text: `Modus: ${await mode($)}. Umschalten mit /model-router auto oder /model-router manual.` }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind !== 'composer' || e.command || (await read($, route)).isDecided) return next(e)
    await update($, route, r => ({ ...r, isDecided: true }))

    const decision = await decide($, e.text).catch(() => null)
    await logDecision($, decision, e.text).catch(() => {})
    if (decision && decision.confidence >= MIN_CONFIDENCE) {
      await update($, route, r => ({ ...r, pending: decision, suggestion: decision.choice }))
    }
    await showStatus($)
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId) return yield* next(e)
    let r = await read($, route)

    if (r.pending) {
      const decision = r.pending
      const current = family(e.model)
      const isSwitch = decision.choice !== current && (await accept($, decision, current))
      r = await update($, route, s => ({
        ...s,
        pending: null,
        model: isSwitch ? decision.choice : null,
        base: e.model,
      }))
      if (!isSwitch) await showStatus($, decision.choice === current ? undefined : `abgelehnt, bleibt bei ${current}`)
    }

    if (!r.model) return yield* next(e)
    if (e.model !== r.base) {
      await update($, route, s => ({ ...s, model: null }))
      await showStatus($, 'aus nach /model')
      return yield* next(e)
    }

    const result = yield* next(e.model.includes(r.model) ? e : { ...e, model: r.model })
    await showStatus($, `antwortet: ${result.usage?.model ?? '?'}`)
    return result
  })
}
