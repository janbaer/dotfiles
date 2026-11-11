import { expect, mock, test } from 'claude-code/testing'

const PROJECTS = JSON.stringify([
  { folder: 'dotfiles', description: 'Config', keywords: ['skill'] },
  { folder: 'ansible-homelab', description: 'Playbooks', keywords: ['ansible'] },
])
const RUN = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const

type Options = {
  enabled?: boolean
  projects?: string
  fails?: 'repo' | 'store' | 'state.get' | 'state.set'
  downstreamFails?: boolean
}

function setup(on: any, answers: (string | 'esc')[], options: Options = {}) {
  const { enabled = true, projects = PROJECTS, fails, downstreamFails = false } = options
  const asked: string[] = []
  const logged: string[] = []
  const calls = { downstream: 0, injected: 0 }
  const fail = (event: string) => () => {
    calls.injected++
    throw new Error(`${event} failed`)
  }
  if (fails === 'store') on('store.get', fail('store.get'))
  else mock.store(on, enabled ? {} : { enabled: false })
  if (fails === 'state.get') on('state.get', fail('state.get'))
  if (fails === 'state.set') on('state.set', fail('state.set'))
  mock.env(on, { HOME: '/home/x' })
  on('session.repo', fails === 'repo' ? fail('session.repo') : () => ({ value: { root: '/home/x/Projects/dotfiles', remote: null, internal: false } }))
  on('fs.read', () => ({ value: projects }))
  on('tool.call', (_: unknown, e: any) => {
    if (e.tool !== 'AskUserQuestion') return undefined
    const question = e.questions[0].question as string
    asked.push(question)
    const answer = answers.shift()
    if (answer === undefined || answer === 'esc') return { deny: 'dismissed' }
    return { result: { questions: e.questions, answers: { [question]: answer } }, text: answer }
  })
  on('process.run', (_: unknown, e: any) => {
    logged.push(String(e.init?.stdin))
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('prompt.submit', (_: unknown, e: any) => {
    calls.downstream++
    if (downstreamFails) throw new Error('downstream failed')
    return { text: e.text, context: e.context }
  })
  return { asked, logged, calls }
}

test('cancel drops the prompt', async ($, on) => {
  const seen = setup(on, ['Abbrechen'])
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(result.drop).toContain('ansible-homelab')
  expect(seen.logged.join('')).toContain('cancel')
})

test('Esc counts as cancel', async ($, on) => {
  setup(on, ['esc'])
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(result.drop).toBeDefined()
})

test('continue sends the prompt and silences that project for the session', async ($, on) => {
  const seen = setup(on, ['Hier weiter'])
  const first = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  const second = await $.prompt.submit({ text: 'ansible again', ...RUN })
  expect(first.drop).toBeUndefined()
  expect(second.drop).toBeUndefined()
  expect(seen.asked).toHaveLength(1)
})

test('free text keeps the prompt and hands the answer to the model', async ($, on) => {
  const seen = setup(on, ['Frage die ansible-homelab Session'])
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(result.drop).toBeUndefined()
  expect(result.context).toEqual(['Answer of the user to the project-guard question: Frage die ansible-homelab Session'])
  expect(seen.logged.join('')).toContain('note')
})

test('does not ask when switched off', async ($, on) => {
  const seen = setup(on, ['Abbrechen'], { enabled: false })
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(result.drop).toBeUndefined()
  expect(seen.asked).toHaveLength(0)
})

test('does not ask for a slash command', async ($, on) => {
  const seen = setup(on, ['Abbrechen'])
  const result = await $.prompt.submit({ text: '/foo ansible', command: { name: 'foo', args: 'ansible' }, ...RUN })
  expect(result.drop).toBeUndefined()
  expect(seen.asked).toHaveLength(0)
})

test('a broken project list lets the prompt through once', async ($, on) => {
  const seen = setup(on, ['Abbrechen'], { projects: '{not json' })
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(result.drop).toBeUndefined()
  expect(result.text).toBe('run ansible now')
  expect(seen.asked).toHaveLength(0)
  expect(seen.calls.downstream).toBe(1)
})

for (const fails of ['repo', 'store'] as const) {
  test(`a failing ${fails} lets the prompt through once without asking`, async ($, on) => {
    const seen = setup(on, ['Abbrechen'], { fails })
    const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
    expect(seen.calls.injected).toBeGreaterThan(0)
    expect(result.drop).toBeUndefined()
    expect(result.text).toBe('run ansible now')
    expect(seen.asked).toHaveLength(0)
    expect(seen.calls.downstream).toBe(1)
  })
}

test('a failing state hook after "Hier weiter" still sends the prompt once', async ($, on) => {
  const seen = setup(on, ['Hier weiter'], { fails: 'state.set' })
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(seen.calls.injected).toBeGreaterThan(0)
  expect(seen.asked).toHaveLength(1)
  expect(result.drop).toBeUndefined()
  expect(result.text).toBe('run ansible now')
  expect(seen.calls.downstream).toBe(1)
})

test('a failing downstream handler propagates and is not retried', async ($, on) => {
  const seen = setup(on, ['Hier weiter'], { downstreamFails: true })
  await expect($.prompt.submit({ text: 'run ansible now', ...RUN })).rejects.toThrow()
  expect(seen.calls.downstream).toBe(1)
})

test('a failing state.get hook is skipped by the engine and the guard works on the default state', async ($, on) => {
  const seen = setup(on, ['Hier weiter'], { fails: 'state.get' })
  const result = await $.prompt.submit({ text: 'run ansible now', ...RUN })
  expect(seen.calls.injected).toBeGreaterThan(0)
  expect(seen.asked).toHaveLength(1)
  expect(result.drop).toBeUndefined()
  expect(result.text).toBe('run ansible now')
  expect(seen.calls.downstream).toBe(1)
})
