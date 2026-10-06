import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Idea } from '../types'

const PANE = 'ideas'
const SCRIPT = '/home/jan/Projects/dotfiles/.claude/skills/jb-ideas/scripts/ideas.sh'
const REFRESH_MS = 60_000

const ideas = atom({ plugin: 'ideas-pane', key: 'ideas' } as const, [] as Idea[])
const error = atom({ plugin: 'ideas-pane', key: 'error' } as const, null as string | null)

async function refresh($: EngineInterface) {
  const { exitCode, stdout, stderr } = await $.process.run(['bash', SCRIPT, 'list'])
  if (exitCode !== 0) {
    await update($, error, () => stderr.trim() || 'ideas.sh list failed')
    return
  }
  const list: Idea[] = stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string) => {
      const [name, date, title] = line.split('\t')
      return { name, date, title }
    })
  await update($, ideas, () => list)
  await update($, error, () => null)
}

async function add($: EngineInterface, text: string) {
  const body = text.trim()
  if (!body) return
  const title = body.length > 60 ? `${body.slice(0, 57)}...` : body
  const { exitCode, stderr } = await $.process.run(['bash', SCRIPT, 'add', title, body])
  if (exitCode !== 0) {
    await $.ui.toast(`Idea not saved: ${stderr.trim()}`)
    return
  }
  await $.ui.toast(`Idea saved: ${title}`)
  await refresh($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'idea',
      description: 'Show the ideas pane, or capture an idea: /idea <text>',
      argumentHint: '[text]',
    })
    $.clock.every(REFRESH_MS, () => void refresh($))
    return next(e)
  })

  on('command.run', { command: 'idea' }, async ($, e) => {
    if (e.args.trim()) await add($, e.args)
    else await refresh($)
    await $.ui.open({ id: PANE, title: 'Ideas' })
    return { text: e.args.trim() ? 'Idea captured.' : 'Ideas pane opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Input } = $.ui.resolve(e)
    const list = await read($, ideas)
    const err = await read($, error)

    return (
      <Box flexDirection="column">
        <Input
          key="new-idea"
          placeholder="New idea, Enter to save"
          submitLabel="save"
          onSubmit={value => void add($, value)}
        />
        {err && <Text color="red">{err}</Text>}
        {!err && list.length === 0 && <Text dimColor>No open ideas.</Text>}
        {list.map(idea => (
          <Button
            key={idea.name}
            label={`${idea.date}  ${idea.title}`}
            onPress={() => void $.prompt.submit({ text: `Use the jb-ideas skill, mode grill, on the idea ${idea.name}.`, asUser: true })}
          />
        ))}
      </Box>
    )
  })
}
