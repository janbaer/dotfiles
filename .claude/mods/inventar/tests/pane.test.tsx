import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'inventar',
  surface: 'terminal',
  component: 'Pane',
  requestId: 'inventar',
  props: {
    title: 'In diesem Chat',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const start = { cwd: '/repo', surface: 'terminal', isInteractive: true } as never

test('files, MCP servers and to-dos show up', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start(start)
  await $.tool.call({ tool: 'Read', file_path: '/repo/src/a.ts' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/repo/src/a.ts', old_string: 'x', new_string: 'y' } as never)
  await $.tool.call({ tool: 'mcp__forgejo-mcp__get_repo', owner: 'jan' } as never)
  await $.tool.call({ tool: 'mcp__forgejo-mcp__list_repo_issues' } as never)
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: 'Doku lesen', activeForm: 'Liest die Doku', status: 'completed' },
      { content: 'Mod bauen', activeForm: 'Baut den Mod', status: 'in_progress' },
      { content: 'Validieren', activeForm: 'Validiert', status: 'pending' },
    ],
  } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /src\/a\.ts/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /geändert 1×, gelesen 1×/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^Forgejo$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^2×$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1\/3/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /▶ Baut den Mod/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /wartet auf dich|denkt nach/ })).toBeDefined()
  await ui.unmount()
})

test('the pane shows the loaded version', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start(start)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /^v0\.1\.8$/ })).toBeDefined()
  await ui.unmount()
})

test('/inventar says whether the pane opened or closed', async ($, on) => {
  mock.clock(on)
  let isOpen = false
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.panes', () => ({ value: (isOpen ? [{ id: 'inventar' }] : []) as never }))
  on('ui.open', () => {
    isOpen = true
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => {
    isOpen = false
    return { value: undefined }
  })

  await $.session.start(start)
  expect((await $.command.run({ command: 'inventar', args: '' } as never))?.text).toBe('Seitenleiste geöffnet.')
  expect((await $.command.run({ command: 'inventar', args: '' } as never))?.text).toBe('Seitenleiste geschlossen.')
})

test('a subagent todo list does not replace the main one', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start(start)
  await $.tool.call({ tool: 'TodoWrite', todos: [{ content: 'Haupt', activeForm: 'Haupt', status: 'pending' }] } as never)
  await $.tool.call({
    tool: 'TodoWrite',
    agentId: 'a1',
    todos: [{ content: 'Neben', activeForm: 'Neben', status: 'pending' }],
  } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Haupt/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Neben/ })).toBeUndefined()
  await ui.unmount()
})

test('a step running past 90 seconds may hang', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.panes', () => ({ value: [{ id: 'inventar' }] as never }))
  let release = () => {}
  on('tool.call', () => new Promise(resolve => (release = () => resolve({ result: {} }))))

  await $.session.start(start)
  const call = $.tool.call({ tool: 'Bash', command: 'sleep 600', description: 'Wartet lange' } as never)
  await clock.advance(30_000)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /führt aus: Wartet lange/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /hängt vielleicht/ })).toBeUndefined()

  await clock.advance(70_000)
  expect(await ui.find({ type: 'Text', text: /hängt vielleicht/ })).toBeDefined()

  release()
  await call
  expect(await ui.find({ type: 'Text', text: /führt aus/ })).toBeUndefined()
  await ui.unmount()
})

test('"Nur das Wichtigste" hides MCP servers, skills and files', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start(start)
  await $.tool.call({ tool: 'Read', file_path: '/repo/b.ts' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /^Dateien/ })).toBeDefined()
  await ui.press({ key: 'compact' })
  expect(await ui.find({ type: 'Text', text: /^Dateien/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^MCP-Server/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^Gerade/ })).toBeDefined()
  await ui.unmount()
})

const reply = (text: string) => ({ value: { isAnswered: true, text, usage: {} } }) as never

test('overlapping first prompts trigger the one Haiku request, for the first of them', async ($, on) => {
  const clock = mock.clock(on)
  const prompts: string[] = []
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('prompt.submit', (_, e) => e as never)
  on('model.complete', (_, e) => {
    prompts.push(String(e.prompt))
    return reply('CI-Pipeline reparieren')
  })

  await $.session.start(start)
  await Promise.all([
    $.prompt.submit({ text: 'CI?', origin: { kind: 'composer' } } as never),
    $.prompt.submit({ text: 'Und jetzt?', origin: { kind: 'composer' } } as never),
  ])
  await clock.advance(10)

  expect(prompts).toEqual(['CI?'])
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /CI-Pipeline reparieren/ })).toBeDefined()
  await ui.unmount()
})

test('a greeting as first prompt still gets a goal from Haiku', async ($, on) => {
  const clock = mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('prompt.submit', (_, e) => e as never)
  on('model.complete', () => reply('KEIN_ZIEL aus der Konfiguration entfernen'))

  await $.session.start(start)
  await $.prompt.submit({ text: 'Hallo', origin: { kind: 'composer' } } as never)
  await clock.advance(10)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /KEIN_ZIEL aus der Konfiguration entfernen/ })).toBeDefined()
  await ui.unmount()
})

test('a failing setup still runs the tool once and returns its result', async ($, on) => {
  let ran = 0
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('clock.now', () => {
    throw new Error('clock down')
  })
  on('tool.call', () => {
    ran += 1
    return { result: { marker: 'ok' } }
  })

  await $.session.start(start)
  const out = await $.tool.call({ tool: 'Bash', command: 'ls' } as never)

  expect(ran).toBe(1)
  expect((out as { result?: { marker?: string } }).result?.marker).toBe('ok')
})

test('/inventar says so when the pane found no room', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.panes', () => ({ value: [] as never }))
  on('ui.open', () => ({ value: { isPlaced: false, reason: 'no room' } }))

  await $.session.start(start)
  const out = await $.command.run({ command: 'inventar', args: '' } as never)

  expect(out?.text).toMatch(/nicht geöffnet/)
})

test('a server named like an object property counts from one', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'inventar' } }))
  on('fs.read', () => ({ value: '{"version":"0.1.8"}' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start(start)
  await $.tool.call({ tool: 'mcp__constructor__ping' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /^1×$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^constructor$/ })).toBeDefined()
  await ui.unmount()
})
