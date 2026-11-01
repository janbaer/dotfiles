import { expect, mock, test } from 'claude-code/testing'

declare const setTimeout: (callback: (value?: unknown) => void, ms: number) => unknown

const TURN = { durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const
const RUN = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const

const signal = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}

test('speaks a finished answer only in auto mode, with the chosen voice', async ($, on) => {
  const spawned = signal<{ argv: readonly string[]; input?: string }>()
  const spawns: unknown[] = []
  const status: (string | undefined)[] = []
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('command.register', () => ({ value: { command: 'speak' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', (_, e) => {
    status.push(e.text)
    return { value: undefined }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('process.spawn', async function* (_, e) {
    spawns.push(e)
    spawned.resolve(e)
    return { value: { code: 0, signal: null } }
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.complete({ ...TURN, answer: 'Erste Antwort' })
  await $.command.run({ ...RUN, command: 'speak', args: 'auto' })
  await $.command.run({ ...RUN, command: 'speak', args: 'voice' })
  await $.turn.complete({ ...TURN, answer: 'Zweite **Antwort**' })
  const { argv, input } = await spawned.promise
  await new Promise(done => setTimeout(done, 50))

  expect(spawns).toHaveLength(1)
  expect(argv[2]).toBe('Charon')
  expect(input).toBe('Zweite Antwort.')
  expect(status.at(-1)).toBe('Claude Sprachmodus: auto · Männlich (Charon)')
})

test('ignores subagent answers and asks for a key when none is set', async ($, on) => {
  const toasted = signal<string>()
  const toasts: string[] = []
  mock.store(on, { auto: true })
  mock.env(on, {})
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    toasted.resolve(e.text)
    return { value: undefined }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))

  await $.turn.complete({ ...TURN, answer: 'Bericht', agentId: 'a1' })
  await $.turn.complete({ ...TURN, answer: 'Antwort' })

  expect(await toasted.promise).toBe('Vorlesen: OPENROUTER_TTS_API_KEY ist nicht gesetzt')
  expect(toasts).toHaveLength(1)
})

test('/speak without an answer says so', async ($, on) => {
  mock.store(on)
  const { text } = await $.command.run({ ...RUN, command: 'speak', args: '' })

  expect(text).toBe('Noch keine Antwort zum Vorlesen.')
})

const PANE = {
  plugin: 'speak',
  component: 'Pane',
  requestId: 'speak',
  props: { title: 'Claude Sprachmodus', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

test('the pane switches mode and voice, and the choice survives in the store', async ($, on) => {
  const status: (string | undefined)[] = []
  mock.store(on)
  mock.env(on, {})
  on('ui.status', (_, e) => {
    status.push(e.text)
    return { value: undefined }
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'auto' })
  await ui.press({ key: 'voice-male' })
  expect(status.at(-1)).toBe('Claude Sprachmodus: auto · Männlich (Charon)')

  await ui.press({ key: 'manual' })
  await ui.press({ key: 'voice-female-next' })
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Weiblich (Laomedeia)')
  await ui.unmount()
})

test('the play button reads the last answer and turns into stop', async ($, on) => {
  const started = signal<string | undefined>()
  const release = signal<void>()
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('ui.status', () => ({ value: undefined }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('process.spawn', async function* (_, e) {
    started.resolve(e.input)
    await release.promise
    return { value: { code: 0, signal: null } }
  })

  await $.turn.complete({ ...TURN, answer: 'Hallo Welt' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'play' })

  expect(await started.promise).toBe('Hallo Welt.')
  expect((await ui.find({ key: 'play' }))?.text).toBe('■ Stop')
  const stopped = ui.press({ key: 'play' })
  release.resolve()
  await stopped
  expect((await ui.find({ key: 'play' }))?.text).toBe('▶ Vorlesen')
  await ui.unmount()
})

test('/speak panel opens the pane', async ($, on) => {
  const opened: string[] = []
  on('ui.open', (_, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  const { text } = await $.command.run({ ...RUN, command: 'speak', args: 'panel' })

  expect(opened).toEqual(['speak'])
  expect(text).toBe('Panel geöffnet.')
})

test('the panel opens at session start only when the option is on', async ($, on) => {
  const opened: string[] = []
  mock.store(on, { panel: true })
  mock.env(on, {})
  on('command.register', () => ({ value: { command: 'speak' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.open', (_, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await new Promise(done => setTimeout(done, 50))

  expect(opened).toEqual(['speak'])
})

test('the option is switched from the pane and with /speak panel auto', async ($, on) => {
  mock.store(on)
  mock.env(on, {})
  on('ui.status', () => ({ value: undefined }))

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'panel-auto' })
  expect((await ui.find({ key: 'panel-auto' }))?.text).toBe('● Beim Start öffnen')

  const { text } = await $.command.run({ ...RUN, command: 'speak', args: 'panel auto' })
  expect(text).toBe('Das Panel öffnet sich nicht mehr beim Start.')
  await ui.unmount()
})

test('the chosen style goes to the script as instructions, normal sends none', async ($, on) => {
  const argvs: (readonly string[])[] = []
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('ui.status', () => ({ value: undefined }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('process.spawn', async function* (_, e) {
    argvs.push(e.argv)
    return { value: { code: 0, signal: null } }
  })

  await $.turn.complete({ ...TURN, answer: 'Hallo' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'play' })
  await ui.press({ key: 'style-ruhig' })
  await ui.press({ key: 'play' })
  await ui.press({ key: 'style-variabel' })
  await ui.press({ key: 'play' })
  await new Promise(done => setTimeout(done, 50))

  expect(argvs.map(argv => argv.at(-1))).toEqual([
    '',
    'Sprich ruhig, gelassen und in angenehm langsamem Tempo.',
    expect.stringContaining('Passe Tonfall und Tempo dem Inhalt an'),
  ])
  await ui.unmount()
})

test('the target language goes to the script as a language code, auto sends none', async ($, on) => {
  const argvs: (readonly string[])[] = []
  const status: (string | undefined)[] = []
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: '[REDACTED:OPENROUTER_TTS_API_KEY]' })
  on('ui.status', (_, e) => {
    status.push(e.text)
    return { value: undefined }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('process.spawn', async function* (_, e) {
    argvs.push(e.argv)
    return { value: { code: 0, signal: null } }
  })

  await $.turn.complete({ ...TURN, answer: 'Hallo' })
  const first = await $.command.run({ ...RUN, command: 'speak', args: 'language' })
  expect(first.text).toBe('Sprache: Deutsch')
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Weiblich (Kore) · Deutsch')
  await $.command.run({ ...RUN, command: 'speak', args: '' })
  await new Promise(done => setTimeout(done, 50))
  await $.command.run({ ...RUN, command: 'speak', args: 'language' })
  await $.command.run({ ...RUN, command: 'speak', args: 'language' })
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Weiblich (Kore)')
  await $.command.run({ ...RUN, command: 'speak', args: '' })
  await new Promise(done => setTimeout(done, 50))

  expect(argvs.map(argv => argv[3])).toEqual(['de-DE', ''])
})

test('/speak style cycles through the styles and shows it in the status', async ($, on) => {
  const status: (string | undefined)[] = []
  mock.store(on)
  mock.env(on, {})
  on('ui.status', (_, e) => {
    status.push(e.text)
    return { value: undefined }
  })

  const first = await $.command.run({ ...RUN, command: 'speak', args: 'style' })
  expect(first.text).toBe('Stil: Ruhig')
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Weiblich (Kore) · Ruhig')
  for (let i = 0; i < 4; i++) await $.command.run({ ...RUN, command: 'speak', args: 'style' })
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Weiblich (Kore)')
})

test('the arrows step through a list, wrap around, and the voice reaches the script', async ($, on) => {
  const argvs: (readonly string[])[] = []
  const status: (string | undefined)[] = []
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('ui.status', (_, e) => {
    status.push(e.text)
    return { value: undefined }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('process.spawn', async function* (_, e) {
    argvs.push(e.argv)
    return { value: { code: 0, signal: null } }
  })

  await $.turn.complete({ ...TURN, answer: 'Hallo' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  await ui.press({ key: 'voice-male-prev' })
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Männlich (Alnilam)')

  for (let i = 0; i < 8; i++) await ui.press({ key: 'voice-female-prev' })
  expect(status.at(-1)).toBe('Claude Sprachmodus: manuell · Weiblich (Zephyr)')

  await ui.press({ key: 'play' })
  await new Promise(done => setTimeout(done, 50))
  expect(argvs[0]?.[2]).toBe('Zephyr')
  await ui.unmount()
})

test('the sample button speaks a fixed sentence with the active voice and stops on a second press', async ($, on) => {
  const started = signal<{ argv: readonly string[]; input?: string }>()
  const release = signal<void>()
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('ui.status', () => ({ value: undefined }))
  on('process.spawn', async function* (_, e) {
    started.resolve(e)
    await release.promise
    return { value: { code: 0, signal: null } }
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'voice-male' })
  await ui.press({ key: 'voice-sample' })
  const { argv, input } = await started.promise

  expect(argv[2]).toBe('Charon')
  expect(input).toContain('Hallo, so klinge ich.')
  expect((await ui.find({ key: 'voice-sample' }))?.text).toBe('■')

  const stopped = ui.press({ key: 'voice-sample' })
  release.resolve()
  await stopped
  expect((await ui.find({ key: 'voice-sample' }))?.text).toBe('♪')
  await ui.unmount()
})

test('switching the voice while a sample plays restarts the sample with the new voice', async ($, on) => {
  const argvs: (readonly string[])[] = []
  const release = signal<void>()
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('ui.status', () => ({ value: undefined }))
  on('process.spawn', async function* (_, e) {
    argvs.push(e.argv)
    await release.promise
    return { value: { code: 0, signal: null } }
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'voice-sample' })
  await ui.press({ key: 'voice-female-next' })
  await ui.press({ key: 'voice-male' })
  await new Promise(done => setTimeout(done, 50))

  expect(argvs.map(argv => argv[2])).toEqual(['Kore', 'Laomedeia', 'Charon'])
  expect((await ui.find({ key: 'voice-sample' }))?.text).toBe('■')
  release.resolve()
  await new Promise(done => setTimeout(done, 50))
  await ui.unmount()
})

test('a failing spawn is reported, not swallowed', async ($, on) => {
  const toasted = signal<string>()
  mock.store(on)
  mock.env(on, { OPENROUTER_TTS_API_KEY: 'sk-test' })
  on('ui.status', () => ({ value: undefined }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('ui.toast', (_, e) => {
    toasted.resolve(e.text)
    return { value: undefined }
  })
  on('process.spawn', async function* () {
    throw new Error('bash fehlt')
  })

  await $.turn.complete({ ...TURN, answer: 'Hallo' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'play' })

  expect(await toasted.promise).toMatch(/^Vorlesen fehlgeschlagen: /)
  await ui.unmount()
})

test('a stop while the start is still pending cancels it', async ($, on) => {
  const gate = signal<void>()
  const spawns: unknown[] = []
  mock.store(on)
  on('ui.status', () => ({ value: undefined }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('env.get', async () => {
    await gate.promise
    return { value: 'sk-test' }
  })
  on('process.spawn', async function* (_, e) {
    spawns.push(e)
    return { value: { code: 0, signal: null } }
  })

  await $.turn.complete({ ...TURN, answer: 'Hallo' })
  await $.command.run({ ...RUN, command: 'speak', args: '' })
  await $.command.run({ ...RUN, command: 'speak', args: 'stop' })
  gate.resolve()
  await new Promise(done => setTimeout(done, 50))

  expect(spawns).toHaveLength(0)
})

test('of two overlapping starts only the latest one plays', async ($, on) => {
  const gate = signal<void>()
  const inputs: (string | undefined)[] = []
  mock.store(on)
  on('ui.status', () => ({ value: undefined }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('env.get', async () => {
    await gate.promise
    return { value: 'sk-test' }
  })
  on('process.spawn', async function* (_, e) {
    inputs.push(e.input)
    return { value: { code: 0, signal: null } }
  })

  await $.turn.complete({ ...TURN, answer: 'Erste Antwort' })
  await $.command.run({ ...RUN, command: 'speak', args: '' })
  await $.turn.complete({ ...TURN, answer: 'Zweite Antwort' })
  await $.command.run({ ...RUN, command: 'speak', args: '' })
  gate.resolve()
  await new Promise(done => setTimeout(done, 50))

  expect(inputs).toEqual(['Zweite Antwort.'])
})
