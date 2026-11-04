import { atom, read, update } from 'claude-code'
import type { EngineInterface as Engine, HookStream, ProcessSpawnChunk, ProcessSpawnResult, Register } from 'claude-code'
import type { Language, Style, View, Voice } from '../types'
import { toChunks, toSpeech } from './spoken'

const PANE = 'speak'
export const REFRESH_INTERVAL_MILLISECONDS = 5000
const view = atom({ plugin: 'speak', key: 'view' } as const, { isAuto: false, voice: 'Kore', isPlaying: false, isPanelAuto: false, style: 'normal', language: 'auto', sampling: null } as View, {
  shape: 'view-5',
})

const FEMALE = ['Achernar', 'Aoede', 'Autonoe', 'Callirrhoe', 'Despina', 'Erinome', 'Gacrux', 'Kore', 'Laomedeia', 'Leda', 'Pulcherrima', 'Sulafat', 'Vindemiatrix', 'Zephyr']
const MALE = ['Achird', 'Algenib', 'Algieba', 'Alnilam', 'Charon', 'Enceladus', 'Fenrir', 'Iapetus', 'Orus', 'Puck', 'Rasalgethi', 'Sadachbia', 'Sadaltager', 'Schedar', 'Umbriel', 'Zubenelgenubi']

const SAMPLE = 'Hallo, so klinge ich. Der Build ist durchgelaufen, alle Tests sind grün.'

const GROUPS = [
  { name: 'female', title: 'Weiblich', list: FEMALE, fallback: 'Kore' },
  { name: 'male', title: 'Männlich', list: MALE, fallback: 'Charon' },
] as const

const isMale = (voice: Voice) => MALE.includes(voice)
const voiceLabel = (voice: Voice) => `${isMale(voice) ? 'Männlich' : 'Weiblich'} (${voice})`

const STYLES: Record<Style, { label: string; instructions: string }> = {
  normal: { label: 'Normal', instructions: '' },
  ruhig: { label: 'Ruhig', instructions: 'Sprich ruhig, gelassen und in angenehm langsamem Tempo.' },
  schnell: { label: 'Schnell', instructions: 'Sprich zügig und sachlich, in schnellem Tempo.' },
  lustig: { label: 'Lustig', instructions: 'Sprich locker, humorvoll und mit einem verschmitzten Unterton.' },
  variabel: {
    label: 'Variabel',
    instructions:
      'Passe Tonfall und Tempo dem Inhalt an: sachlich und zügig bei technischen Details, ruhig bei Erklärungen, locker bei Erfolgen, ernst bei Fehlern und Warnungen.',
  },
}

const LANGUAGES: Record<Language, { label: string; code: string }> = {
  auto: { label: 'Auto', code: '' },
  de: { label: 'Deutsch', code: 'de-DE' },
  en: { label: 'Englisch', code: 'en-US' },
}

type Playback = { child: HookStream<ProcessSpawnChunk, ProcessSpawnResult> | null; generation: number; queue: string[]; active: number }

async function settings($: Engine) {
  const [auto, voice, panel, style, language] = await Promise.all(['auto', 'voice', 'panel', 'style', 'language'].map(key => $.store.get(key)))
  return {
    isAuto: auto === true,
    voice: typeof voice === 'string' && [...FEMALE, ...MALE].includes(voice) ? voice : 'Kore',
    isPanelAuto: panel === true,
    style: (typeof style === 'string' && style in STYLES ? style : 'normal') as Style,
    language: (typeof language === 'string' && language in LANGUAGES ? language : 'auto') as Language,
  }
}

async function showStatus($: Engine, { isAuto, voice, style, language }: Awaited<ReturnType<typeof settings>>) {
  const mood = style === 'normal' ? '' : ` · ${STYLES[style].label}`
  const lang = language === 'auto' ? '' : ` · ${LANGUAGES[language].label}`
  $.ui.status(`Claude Sprachmodus: ${isAuto ? 'auto' : 'manuell'} · ${voiceLabel(voice)}${mood}${lang}`)
}

async function setView($: Engine, patch: Partial<View>) {
  await update($, view, current => ({ ...current, ...patch }))
}

const STORE_KEYS = { isAuto: 'auto', voice: 'voice', style: 'style', language: 'language', isPanelAuto: 'panel' } as const

async function save($: Engine, patch: Partial<Pick<View, keyof typeof STORE_KEYS>>) {
  for (const [field, value] of Object.entries(patch)) {
    await $.store.set(STORE_KEYS[field as keyof typeof STORE_KEYS], value)
  }
  await setView($, patch)
  await showStatus($, await settings($))
}

async function sync($: Engine) {
  const [saved, current] = await Promise.all([settings($), read($, view)])
  if ((Object.keys(STORE_KEYS) as (keyof typeof STORE_KEYS)[]).every(field => saved[field] === current[field])) return
  await setView($, saved)
  await showStatus($, saved)
}

const stepped = <T extends string>(list: readonly T[], from: T, delta: number) =>
  list[(list.indexOf(from) + delta + list.length) % list.length] as T

function cancel(playback: Playback) {
  void playback.child?.return({ code: null, signal: 'SIGTERM' })
  playback.child = null
  return ++playback.generation
}

async function stop($: Engine, playback: Playback) {
  playback.queue.length = 0
  const wasPlaying = playback.child !== null
  cancel(playback)
  if (wasPlaying) await setView($, { isPlaying: false, sampling: null })
}

async function speak($: Engine, playback: Playback, answer: string, sample?: Voice) {
  playback.queue.length = 0
  await playAnswer($, playback, answer, sample)
}

function enqueue($: Engine, playback: Playback, answer: string) {
  playback.queue.push(answer)
  if (playback.active === 0) void playAnswer($, playback, playback.queue.shift() as string)
}

async function playAnswer($: Engine, playback: Playback, answer: string, sample?: Voice) {
  playback.active++
  try {
    await playOnce($, playback, answer, sample)
  } finally {
    playback.active--
    const next = playback.active === 0 ? playback.queue.shift() : undefined
    if (next !== undefined) void playAnswer($, playback, next)
  }
}

async function playOnce($: Engine, playback: Playback, answer: string, sample?: Voice) {
  const wasPlaying = playback.child !== null
  const mine = cancel(playback)
  if (wasPlaying) await setView($, { isPlaying: false, sampling: null })
  const input = toChunks(toSpeech(answer)).join('\n')
  if (!input) return
  const [key, { voice: active, style, language }] = await Promise.all([$.env.get('OPENROUTER_TTS_API_KEY'), settings($)])
  if (mine !== playback.generation) return
  if (!key) {
    $.ui.toast('Vorlesen: OPENROUTER_TTS_API_KEY ist nicht gesetzt')
    return
  }

  const argv = ['bash', `${$.plugin.root}/hooks/speak.sh`, sample ?? active, LANGUAGES[language].code, STYLES[style].instructions]
  const child = $.process.spawn({ argv, input })
  playback.child = child
  await setView($, { isPlaying: true, sampling: sample ?? null })
  let stderr = ''
  try {
    for await (const chunk of child) if (chunk.stream === 'stderr') stderr += chunk.text
    const { code } = await child.result
    if (code && playback.child === child) $.ui.toast(`Vorlesen fehlgeschlagen: ${stderr.trim() || `exit ${code}`}`)
  } catch (error) {
    if (playback.child === child) $.ui.toast(`Vorlesen fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    if (playback.child === child) {
      playback.child = null
      await setView($, { isPlaying: false, sampling: null })
    }
  }
}

export const register: Register = on => {
  let answers: string[] = []
  let isFresh = true
  let version = ''
  const playback: Playback = { child: null, generation: 0, queue: [], active: 0 }
  let refresh: { cancel: () => void } | null = null
  const lastAnswer = () => answers.join('\n\n')

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'speak',
      description: 'Letzte Antwort vorlesen',
      argumentHint: '[auto|voice|style|language|stop|panel [auto]]',
    })
    version = JSON.parse(await $.fs.read(`${$.plugin.root}/.claude-plugin/plugin.json`)).version
    const saved = await settings($)
    await setView($, saved)
    await showStatus($, saved)
    if (saved.isPanelAuto) void $.ui.open({ id: PANE, title: 'Sprachmodus' })
    refresh?.cancel()
    refresh = $.clock.every(REFRESH_INTERVAL_MILLISECONDS, () => void sync($).catch(() => {}))
    return started
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId && e.reason === 'answer' && e.answer) {
      if (isFresh) answers = []
      isFresh = false
      answers.push(e.answer)
      if ((await settings($)).isAuto) void enqueue($, playback, e.answer)
    }
    return result
  })

  on('prompt.submit', async ($, e, next) => {
    if (!e.isMeta) {
      isFresh = true
      await stop($, playback)
    }
    return next(e)
  })

  on('command.run', { command: 'speak' }, async ($, e) => {
    const arg = e.args.trim()

    if (arg === 'stop') {
      await stop($, playback)
      return { text: 'Wiedergabe gestoppt.' }
    }
    if (arg === 'auto') {
      const isAuto = !(await settings($)).isAuto
      await save($, { isAuto })
      return { text: isAuto ? 'Antworten werden automatisch vorgelesen.' : 'Vorlesen nur noch mit /speak.' }
    }
    if (arg === 'voice') {
      const voice: Voice = (isMale((await settings($)).voice) ? GROUPS[0] : GROUPS[1]).fallback
      await save($, { voice })
      return { text: `Stimme: ${voiceLabel(voice)}` }
    }
    if (arg === 'style') {
      const style = stepped(Object.keys(STYLES) as Style[], (await settings($)).style, 1)
      await save($, { style })
      return { text: `Stil: ${STYLES[style].label}` }
    }
    if (arg === 'language') {
      const language = stepped(Object.keys(LANGUAGES) as Language[], (await settings($)).language, 1)
      await save($, { language })
      return { text: `Sprache: ${LANGUAGES[language].label}` }
    }
    if (arg === 'panel auto') {
      const isPanelAuto = !(await settings($)).isPanelAuto
      await save($, { isPanelAuto })
      return { text: isPanelAuto ? 'Das Panel öffnet sich beim Start.' : 'Das Panel öffnet sich nicht mehr beim Start.' }
    }
    if (arg === 'panel') {
      const { isPlaced } = await $.ui.open({ id: PANE, title: 'Sprachmodus' })
      return { text: isPlaced ? 'Panel geöffnet.' : 'Das Panel findet gerade keinen Platz.' }
    }
    if (arg) return { text: `Unbekannt: ${arg}. Erlaubt: /speak [auto|voice|style|language|stop|panel [auto]]` }
    const text = lastAnswer()
    if (!text) return { text: 'Noch keine Antwort zum Vorlesen.' }

    void speak($, playback, text)
    return { text: 'Lese die letzte Antwort vor.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const current = await read($, view)

    const play = () => {
      if (current.isPlaying) return stop($, playback)
      const text = lastAnswer()
      if (!text) {
        $.ui.toast('Noch keine Antwort zum Vorlesen')
        return
      }
      void speak($, playback, text)
    }

    const pick = async (voice: Voice) => {
      await save($, { voice })
      if (current.sampling !== null) void speak($, playback, SAMPLE, voice)
    }

    const option = (isOn: boolean, label: string) => `${isOn ? '●' : '○'} ${label}`

    const choice = (key: string, isOn: boolean, label: string, onPress: () => void | Promise<void>) => (
      <Button key={key} label={option(isOn, label)} variant={isOn ? 'primary' : 'secondary'} dimColor={!isOn} onPress={onPress} />
    )

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold>Claude Sprachmodus</Text>
          <Text dimColor>v{version}</Text>
        </Box>
        {current.isPlaying ? (
          <Text bold color="green">▶ Spricht gerade</Text>
        ) : (
          <Text dimColor>■ Bereit</Text>
        )}
        <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
          <Text dimColor>Modus</Text>
          <Box flexDirection="column">
            {choice('manual', !current.isAuto, 'Manuell', () => save($, { isAuto: false }))}
            {choice('auto', current.isAuto, 'Auto', () => save($, { isAuto: true }))}
          </Box>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
          <Box justifyContent="space-between">
            <Text dimColor>Stimme</Text>
            <Button key="voice-sample" label={current.sampling === null ? '♪' : '■'} onPress={() => (current.sampling === null ? void speak($, playback, SAMPLE, current.voice) : stop($, playback))} />
          </Box>
          {GROUPS.map(({ name, title, list, fallback }) => {
            const isOn = isMale(current.voice) === (name === 'male')
            const shown = isOn ? current.voice : fallback
            return (
              <Box key={name} flexDirection="column">
                <Text dimColor={!isOn}>{option(isOn, title)}</Text>
                <Box gap={1}>
                  <Button key={`voice-${name}-prev`} label="◂" onPress={() => pick(stepped(list, shown, -1))} />
                  <Button key={`voice-${name}`} label={shown} variant={isOn ? 'primary' : 'secondary'} dimColor={!isOn} onPress={() => pick(shown)} />
                  <Button key={`voice-${name}-next`} label="▸" onPress={() => pick(stepped(list, shown, 1))} />
                </Box>
              </Box>
            )
          })}
        </Box>
        <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
          <Text dimColor>Stil</Text>
          <Box flexDirection="column">
            {(Object.keys(STYLES) as Style[]).map(name => (
              choice(`style-${name}`, current.style === name, STYLES[name].label, () => save($, { style: name }))
            ))}
          </Box>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
          <Text dimColor>Sprache</Text>
          <Box flexDirection="column">
            {(Object.keys(LANGUAGES) as Language[]).map(name => (
              choice(`language-${name}`, current.language === name, LANGUAGES[name].label, () => save($, { language: name }))
            ))}
          </Box>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
          <Text dimColor>Panel</Text>
          {choice('panel-auto', current.isPanelAuto, 'Beim Start öffnen', () => save($, { isPanelAuto: !current.isPanelAuto }))}
        </Box>
        <Button key="play" label={current.isPlaying ? '■ Stop' : '▶ Vorlesen'} variant="primary" onPress={play} />
      </Box>
    )
  })
}
