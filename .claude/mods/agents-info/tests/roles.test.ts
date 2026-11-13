import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'agents-info'
const pane = { title: '', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} } as const

const CASES: readonly (readonly [type: string, description: string, role: string])[] = [
  ['Explore', 'Find the config files', 'Rechercheur'],
  ['Plan', 'Strategy for the migration', 'Planer'],
  ['code-reviewer', 'Look at the diff', 'Prüfer'],
  ['general-purpose', 'Prüfe die Migration', 'Prüfer'],
  ['general-purpose', 'Write the README', 'Schreiber'],
  ['general-purpose', 'Design the header layout', 'Gestalter'],
  ['general-purpose', 'Implement the parser', 'Entwickler'],
  ['general-purpose', 'Fix the failing test', 'Entwickler'],
  ['general-purpose', 'Explore the codebase', 'Rechercheur'],
  ['general-purpose', 'Sort my socks', 'Helfer'],
]

for (const [type, description, role] of CASES) {
  test(`role: ${type} "${description}" is ${role}`, async ($, on) => {
    mock.clock(on)
    mock.env(on, {})
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', () => ({ cwd: '/tmp' }) as never)
    on('agent.spawn', () => ({ model: 'claude-opus-5', agentId: 'a1' }))
    await ($.session.start as (e: unknown) => Promise<unknown>)({ cwd: '/tmp', surface: 'terminal', source: 'startup' })
    await $.agent.spawn({ tool_use_id: 't1', prompt: 'p', description, subagentType: type, provider: 'engine', parentModel: 'claude-opus-5', background: false, fork: false } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'agents-info', props: pane })
    expect(await ui.find({ type: 'Text', text: new RegExp(`${role} · `) })).toBeDefined()
  })
}
