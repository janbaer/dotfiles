import type { Register } from 'claude-code'

const CELLS = 20
const FALLBACK_THRESHOLD = 0.83
const CHUNK = 1800
const PING = 'Kurzer Ping, damit der Cache warm bleibt. Antworte nur mit „ok“.'

type Snapshot = {
  window: number
  tokens: number
  threshold: number
  hitRate: number | null
}

const kilo = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)

const chunkSummary = (text: string) => {
  const chunks: string[] = []
  let current = ''
  const push = (part: string) => {
    if (current && current.length + part.length + 2 > CHUNK) {
      chunks.push(current)
      current = ''
    }
    current = current ? `${current}\n\n${part}` : part
  }

  for (const paragraph of text.split(/\n{2,}/)) {
    if (paragraph.length <= CHUNK) {
      push(paragraph)
      continue
    }
    for (let i = 0; i < paragraph.length; i += CHUNK) {
      push(paragraph.slice(i, i + CHUNK))
    }
  }
  if (current) chunks.push(current)

  return chunks
}

export const register: Register = on => {
  let ttlMinutes = 60
  let lastResponseAt: number | null = null
  let snapshot: Snapshot | null = null
  let isWorking = false
  let isCollapsed = false
  let isQueued = false
  let isKeepingWarm = false
  let warmLoopId = 0
  let timer: { cancel: () => void } | null = null

  const measure = (context: any) => {
    const breakdown = context.breakdown
    const usage = context.apiUsage ?? breakdown?.apiUsage ?? null
    const window = breakdown?.rawMaxTokens ?? context.window
    const threshold =
      breakdown?.autoCompactThreshold ?? Math.round(window * FALLBACK_THRESHOLD)
    const input = usage
      ? usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens
      : 0

    snapshot = {
      window,
      tokens: context.tokens ?? 0,
      threshold,
      hitRate: usage && input > 0 ? (usage.cache_read_input_tokens / input) * 100 : null,
    }
  }

  on('session.start', async ($, e, next) => {
    if ((await $.env.get('FORCE_PROMPT_CACHING_5M')) === '1') ttlMinutes = 5

    timer?.cancel()
    timer = $.clock.every(60000, () => $.ui.invalidate('ui.render'))
    await $.command.register({
      name: 'keep-warm',
      description: 'Prompt-Cache warm halten, solange du weg bist (an/aus)',
    })

    return next(e)
  })

  on('command.run', { command: 'keep-warm' }, async $ => {
    isKeepingWarm = !isKeepingWarm
    $.ui.status(isKeepingWarm ? '🔥 keep-warm an' : undefined)
    if (isKeepingWarm) {
      const id = ++warmLoopId
      const totalMs = ttlMinutes * 60000
      const marginMs = Math.min(60000, totalMs / 6)
      const idleMs = async () =>
        lastResponseAt === null ? 0 : (await $.clock.now()) - lastResponseAt

      void (async () => {
        while (isKeepingWarm && id === warmLoopId) {
          await $.clock.sleep(Math.max(5000, totalMs - marginMs - (await idleMs())))
          if (!isKeepingWarm || id !== warmLoopId) return
          if (!isWorking && lastResponseAt !== null && (await idleMs()) >= totalMs - marginMs) {
            $.ui.status('🔥 Cache wird warm gehalten')
            await $.prompt.submit({ text: PING })
          }
        }
      })()
    }

    return {
      text: isKeepingWarm
        ? 'keep-warm ist an: Kurz bevor der Cache kalt wird, schicke ich einen Mini-Ping.'
        : 'keep-warm ist aus.',
    }
  })

  on('turn.start', ($, e, next) => {
    isWorking = true

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    isWorking = false
    lastResponseAt = await $.clock.now()
    measure((await $.session.usage({ breakdown: 'summary' })).context)
    $.ui.invalidate('ui.render')

    if (isQueued) {
      isQueued = false
      void $.command.run({ command: 'compact' })
    }

    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)

    if (e.trigger === 'precompute' || e.agentId || result.skip) return result

    const before = result.tokensBefore
    const after = result.tokensAfter
    const summary = result.messages.find(m => m.text.trim())?.text ?? ''
    const counts =
      before !== undefined && after !== undefined
        ? `${kilo(before)} -> ${kilo(after)} Tokens`
        : 'Token-Zahlen fehlen'

    $.ui.log(`Compact: ${counts}`)
    for (const part of chunkSummary(summary)) $.ui.log(part)

    lastResponseAt = await $.clock.now()
    measure((await $.session.usage({ breakdown: 'summary' })).context)
    $.ui.invalidate('ui.render')

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !snapshot) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const now = await $.clock.now()
    const totalMs = ttlMinutes * 60000
    const leftMs = lastResponseAt === null ? 0 : Math.max(0, totalMs - (now - lastResponseAt))
    const fraction = leftMs / totalMs
    const minutes = Math.ceil(leftMs / 60000)
    const barColor = fraction <= 0.1 ? 'red' : fraction <= 0.25 ? 'yellow' : 'green'
    const filled = Math.ceil(fraction * CELLS)
    const bar = '■'.repeat(filled) + '□'.repeat(CELLS - filled)
    const cache =
      lastResponseAt === null ? 'Cache -' : leftMs === 0 ? 'abgelaufen' : `Cache ${minutes} min`

    const used = snapshot.threshold > 0 ? snapshot.tokens / snapshot.threshold : 0
    const weather = used <= 0.5 ? '☀️' : used <= 0.8 ? '🌧️' : '⛈️'
    const percent = snapshot.window > 0 ? Math.round((snapshot.tokens / snapshot.window) * 100) : 0
    const thresholdPercent =
      snapshot.window > 0 ? Math.round((snapshot.threshold / snapshot.window) * 100) : 0

    const toggle = (
      <Button key="toggle" label={isCollapsed ? '▸' : '▾'} onPress={() => {
        isCollapsed = !isCollapsed
        $.ui.invalidate('ui.render')
      }} />
    )

    if (isCollapsed) {
      return (
        <Box>
          {toggle}
          <Text> {weather} </Text>
          <Text color={barColor}>{cache}</Text>
          <Text> | {percent}%</Text>
        </Box>
      )
    }

    const compact = async (press: { surface: string }) => {
      if (press.surface === 'terminal' && !isWorking) {
        try {
          await $.session.compact()
          return
        } catch {}
      }
      if (isWorking) {
        isQueued = true
        $.ui.toast('/compact vorgemerkt, startet nach Claude')
      } else {
        void $.command.run({ command: 'compact' })
      }
    }

    return (
      <Box>
        {toggle}
        <Text> </Text>
        <Text color={barColor}>{cache} {leftMs > 0 ? bar : ''}</Text>
        <Text> | Treffer {snapshot.hitRate === null ? '-' : `${Math.round(snapshot.hitRate)}%`}</Text>
        <Text> | {weather} {percent}% / {thresholdPercent}% </Text>
        <Button key="compact" label="Compact" variant={weather === '⛈️' ? 'primary' : 'secondary'} onPress={compact} />
      </Box>
    )
  })
}
