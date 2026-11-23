import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { FileUse, Goal, Phase, Running, Todo, TodoStatus } from '../types'

const PANE = 'inventar'
const TITLE = 'Inventar'
const HANG_MS = 90_000
const TICK_MS = 5_000

const running = atom({ plugin: 'inventar', key: 'running' } as const, [] as Running[])
const phase = atom({ plugin: 'inventar', key: 'phase' } as const, { kind: 'idle', since: 0 } as Phase)
const goal = atom({ plugin: 'inventar', key: 'goal' } as const, null as Goal | null)
const goalAsked = atom({ plugin: 'inventar', key: 'goalAsked' } as const, false)
const todos = atom({ plugin: 'inventar', key: 'todos' } as const, [] as Todo[])
const connectors = atom({ plugin: 'inventar', key: 'connectors' } as const, {} as Record<string, number>)
const skills = atom({ plugin: 'inventar', key: 'skills' } as const, {} as Record<string, number>)
const files = atom({ plugin: 'inventar', key: 'files' } as const, [] as FileUse[])
const agents = atom({ plugin: 'inventar', key: 'agents' } as const, {} as Record<string, string>)
const isCompact = atom({ plugin: 'inventar', key: 'isCompact' } as const, false)
const now = atom({ plugin: 'inventar', key: 'now' } as const, 0)

const NO_HANG = new Set(['Agent', 'AskUserQuestion', 'Monitor'])
const FILE_TOOLS: Record<string, boolean> = { Read: false, Edit: true, MultiEdit: true, Write: true, NotebookEdit: true }
const MAX_FILES = 50

type Badge = { label: string; letter: string; color: string }

const KNOWN: Record<string, Badge> = {
  'forgejo-mcp': { label: 'Forgejo', letter: 'F', color: '#fb923c' },
  'vikunja-builtin': { label: 'Vikunja', letter: 'V', color: '#818cf8' },
  unifi: { label: 'UniFi', letter: 'U', color: '#38bdf8' },
  'imap-mcp': { label: 'Mail', letter: 'M', color: '#60a5fa' },
  'caldav-mcp': { label: 'Kalender', letter: 'K', color: '#f87171' },
  'carddav-mcp': { label: 'Kontakte', letter: 'A', color: '#4ade80' },
  'howcani-mcp': { label: 'HowCanI', letter: 'H', color: '#c084fc' },
  context7: { label: 'Context7', letter: '7', color: '#34d399' },
  'claude-in-chrome': { label: 'Chrome', letter: 'C', color: '#facc15' },
  claude_ai_Claude_Docs: { label: 'Claude Docs', letter: 'D', color: '#d97757' },
}

const PALETTE = ['#f472b6', '#a3e635', '#2dd4bf', '#fbbf24', '#93c5fd', '#e879f9']

const GOAL_SYSTEM =
  'Du bekommst die erste Nachricht eines Chats mit einem Coding-Assistenten. ' +
  'Fasse in einem kurzen deutschen Satz (höchstens 15 Wörter) zusammen, was der Nutzer erreichen will. ' +
  'Antworte nur mit dem Satz, ohne Anführungszeichen.'

function mcpServer(tool: string): { server: string; name: string } | null {
  if (!tool.startsWith('mcp__')) return null
  const rest = tool.slice(5)
  const cut = rest.lastIndexOf('__')
  if (cut <= 0) return null
  return { server: rest.slice(0, cut), name: rest.slice(cut + 2) }
}

function badge(server: string): Badge {
  const known = own(KNOWN, server) ? KNOWN[server] : undefined
  if (known) return known
  const label = server
    .replace(/^claude_ai_/, '')
    .replace(/^plugin_/, '')
    .replace(/[-_]mcp$/, '')
    .replace(/[-_]+/g, ' ')
  let hash = 0
  for (const c of server) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return { label, letter: (label[0] ?? '?').toUpperCase(), color: PALETTE[hash % PALETTE.length] ?? '#93c5fd' }
}

function short(text: string, max = 48): string {
  const line = (text.split('\n')[0] ?? '').trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

function basename(path: string): string {
  return path.split('/').pop() || path
}

function describe(tool: string, input: Record<string, unknown>): string {
  const s = (key: string) => (typeof input[key] === 'string' ? (input[key] as string) : '')
  switch (tool) {
    case 'Read':
      return `liest ${basename(s('file_path'))}`
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
      return `ändert ${basename(s('file_path'))}`
    case 'NotebookEdit':
      return `ändert ${basename(s('notebook_path'))}`
    case 'Bash':
      return `führt aus: ${short(s('description') || s('command'))}`
    case 'Grep':
      return `durchsucht Dateien nach ${short(s('pattern'), 30)}`
    case 'Glob':
      return `sucht Dateien ${short(s('pattern'), 30)}`
    case 'Agent':
      return `Agent arbeitet: ${short(s('description'))}`
    case 'WebFetch':
      return `lädt ${s('url').replace(/^\w+:\/\/([^/]+).*$/, '$1')}`
    case 'WebSearch':
      return `sucht im Web: ${short(s('query'))}`
    case 'Skill':
      return `lädt Skill ${s('skill')}`
    case 'TodoWrite':
    case 'TaskCreate':
    case 'TaskUpdate':
      return 'aktualisiert die To-do-Liste'
    case 'AskUserQuestion':
      return 'wartet auf deine Antwort'
  }
  const mcp = mcpServer(tool)
  if (mcp) return `${badge(mcp.server).label}: ${mcp.name}`
  return tool
}

function elapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${s % 60} s`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}

function relative(path: string, cwd: string): string {
  return cwd && path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : path
}

const own = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key)

const bump = (map: Record<string, number>, key: string) => ({ ...map, [key]: (own(map, key) ? (map[key] ?? 0) : 0) + 1 })

async function isPaneOpen($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(p => p.id === PANE)
}

async function tick($: EngineInterface): Promise<void> {
  const at = await $.clock.now()
  await update($, now, () => at)
}

async function togglePane($: EngineInterface): Promise<'opened' | 'closed' | 'unplaced'> {
  if (await isPaneOpen($)) {
    await $.ui.close({ id: PANE })
    return 'closed'
  }
  await tick($)
  const opened = await $.ui.open({ id: PANE, title: TITLE, focus: true })
  return opened.isPlaced ? 'opened' : 'unplaced'
}

async function summarise($: EngineInterface, text: string): Promise<void> {
  const r = await $.model
    .complete({
      model: 'haiku',
      system: GOAL_SYSTEM,
      prompt: text.slice(0, 4000),
      maxTokens: 80,
      effort: 'low',
      timeoutMs: 20_000,
    })
    .catch(() => undefined)
  const reply = r?.isAnswered ? r.text.trim() : ''
  const found: Goal = reply
    ? { text: short(reply, 160), source: 'haiku' }
    : { text: short(text, 160), source: 'prompt' }
  await update($, goal, g => (g?.source === 'goal' ? g : found))
}

async function noteTodos($: EngineInterface, tool: string, input: Record<string, unknown>, result: unknown): Promise<void> {
  if (tool === 'TodoWrite' && Array.isArray(input.todos)) {
    const list = input.todos as { content: string; activeForm?: string; status: TodoStatus }[]
    await update($, todos, () => list.map(t => ({ content: t.content, activeForm: t.activeForm, status: t.status })))
  } else if (tool === 'TaskCreate') {
    const id = (result as { task?: { id?: string } } | undefined)?.task?.id
    const todo: Todo = {
      id,
      content: String(input.subject ?? ''),
      activeForm: typeof input.activeForm === 'string' ? input.activeForm : undefined,
      status: 'pending',
    }
    await update($, todos, list => [...list, todo])
  } else if (tool === 'TaskUpdate') {
    const id = String(input.taskId ?? '')
    const status = input.status as TodoStatus | 'deleted' | undefined
    await update($, todos, list =>
      status === 'deleted'
        ? list.filter(t => t.id !== id)
        : list.map(t =>
            t.id !== id
              ? t
              : {
                  ...t,
                  status: status ?? t.status,
                  content: typeof input.subject === 'string' ? input.subject : t.content,
                  activeForm: typeof input.activeForm === 'string' ? input.activeForm : t.activeForm,
                },
          ),
    )
  }
}

async function noteFile($: EngineInterface, path: string, isChange: boolean): Promise<void> {
  await update($, files, list => {
    const old = list.find(f => f.path === path)
    const next: FileUse = {
      path,
      reads: (old?.reads ?? 0) + (isChange ? 0 : 1),
      changes: (old?.changes ?? 0) + (isChange ? 1 : 0),
    }
    return [next, ...list.filter(f => f.path !== path)].slice(0, MAX_FILES)
  })
}

async function settle($: EngineInterface, id: string, isMain: boolean): Promise<void> {
  const end = await $.clock.now()
  await update($, running, list => list.filter(r => r.id !== id))
  if (isMain) await update($, phase, () => ({ kind: 'thinking', since: end }))
}

async function begin($: EngineInterface, e: { agentId?: string }, id: string, tool: string, input: Record<string, unknown>): Promise<void> {
  const at = await $.clock.now()
  const agent = e.agentId ? ((await read($, agents))[e.agentId] ?? 'Agent') : undefined
  const entry: Running = { id, label: describe(tool, input), since: at, agent, canHang: !NO_HANG.has(tool) }
  await update($, running, list => [...list, entry])
}

async function noteResult(
  $: EngineInterface,
  tool: string,
  input: Record<string, unknown>,
  result: unknown,
  isMain: boolean,
): Promise<void> {
  const path = String(input.file_path ?? input.notebook_path ?? '')
  const isChange = own(FILE_TOOLS, tool) ? FILE_TOOLS[tool] : undefined
  if (path && isChange !== undefined) await noteFile($, path, isChange)
  if (!isMain) return
  await noteTodos($, tool, input, result)
  if (tool === 'SetGoal' && typeof input.condition === 'string') {
    const text = short(input.condition, 160)
    await update($, goal, () => ({ text, source: 'goal' }))
  }
}

export const register: Register = on => {
  let cwd = ''
  let version = ''
  let timer: { cancel: () => void } | undefined
  let isGoalClaimed = false

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    cwd = e.cwd
    isGoalClaimed = false
    version = JSON.parse(await $.fs.read(`${$.plugin.root}/.claude-plugin/plugin.json`)).version
    await $.command.register({
      name: 'inventar',
      description: 'Seitenleiste "In diesem Chat" ein- oder ausblenden',
    })
    timer?.cancel()
    timer = $.clock.every(TICK_MS, () => {
      void (async () => {
        if (await isPaneOpen($)) await tick($)
      })()
    })
    return started
  })

  on('command.run', { command: 'inventar' }, async $ => {
    const result = await togglePane($)
    const text = {
      opened: 'Seitenleiste geöffnet.',
      closed: 'Seitenleiste geschlossen.',
      unplaced: 'Seitenleiste konnte nicht geöffnet werden, das Fenster ist zu schmal.',
    }
    return { text: text[result] }
  })

  on('prompt.submit', async ($, e, next) => {
    const isTyped =
      e.origin?.kind === 'composer' && !e.command && !e.isMeta && !e.attachments?.length && e.text.trim() !== ''
    if (isTyped && !isGoalClaimed) {
      isGoalClaimed = true
      if (!(await read($, goalAsked))) {
        await update($, goalAsked, () => true)
        const text = e.text
        $.clock.after(0, () => void summarise($, text))
      }
    }
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      const at = await $.clock.now()
      await update($, phase, () => ({ kind: 'thinking', since: at }))
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (!e.agentId) {
      const at = await $.clock.now()
      await update($, phase, () => ({ kind: 'idle', since: at }))
      await update($, running, list => list.filter(r => r.agent !== undefined))
    }
    return done
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    const id = started.deny === undefined ? started.agentId : undefined
    if (id) await update($, agents, map => ({ ...map, [id]: e.subagentType })).catch(() => undefined)
    return started
  })

  on('skill.prompt', async ($, e, next) => {
    await update($, skills, map => bump(map, e.skill))
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const tool: string = e.tool
    const input = e as unknown as Record<string, unknown>
    const isMain = !e.agentId
    const id = e.tool_use_id ?? tool
    await begin($, e, id, tool, input).catch(() => undefined)

    const ran = await next(e).finally(() => settle($, id, isMain).catch(() => undefined))
    if (ran.deny === undefined && !ran.isError) {
      const mcp = mcpServer(tool)
      if (mcp) await update($, connectors, map => bump(map, mcp.server)).catch(() => undefined)
      await noteResult($, tool, input, ran.result, isMain).catch(() => undefined)
    }
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const [at, compact, busy, ph, g, list] = await Promise.all([
      read($, now),
      read($, isCompact),
      read($, running),
      read($, phase),
      read($, goal),
      read($, todos),
    ])
    const rest = compact ? null : await Promise.all([read($, connectors), read($, skills), read($, files)])

    const head = (key: string, text: string) => (
      <Text key={key} bold color="cyan">
        {text}
      </Text>
    )
    const gap = (key: string) => <Text key={key}> </Text>
    const none = (key: string) => (
      <Text key={key} dimColor>
        keine
      </Text>
    )
    const countRow = (key: string, name: string, count: number) => (
      <Box key={key} columnGap={1}>
        <Text>{name}</Text>
        <Text dimColor>{count}×</Text>
      </Box>
    )
    const byCount = (map: Record<string, number>) => Object.entries(map).sort((a, b) => b[1] - a[1])

    const current = [...busy].sort((a, b) => Number(b.canHang) - Number(a.canHang) || b.since - a.since)[0]
    const label = current
      ? `${current.agent ? `${current.agent} · ` : ''}${current.label}`
      : ph.kind === 'thinking'
        ? 'denkt nach'
        : 'wartet auf dich'
    const since = current?.since ?? ph.since
    const age = since > 0 ? Math.max(0, at - since) : 0
    const isStuck = since > 0 && (current ? current.canHang : ph.kind === 'thinking') && age > HANG_MS

    const done = list.filter(t => t.status === 'completed').length

    const rows = [
      <Box key="bar" justifyContent="space-between">
        <Button
          key="compact"
          label={compact ? 'Alles zeigen' : 'Nur das Wichtigste'}
          hotkey="w"
          onPress={() => update($, isCompact, v => !v)}
        />
        <Text dimColor>v{version}</Text>
      </Box>,
      head('h-now', 'Gerade'),
      <Text key="now-label">{label}</Text>,
      since > 0 ? (
        <Text key="now-since" dimColor={!isStuck} color={isStuck ? 'yellow' : undefined}>
          {isStuck ? `⚠ hängt vielleicht, seit ${elapsed(age)}` : `seit ${elapsed(age)}`}
          {busy.length > 1 ? ` · ${busy.length - 1} weitere laufen` : ''}
        </Text>
      ) : null,
      gap('gap-goal'),
      head('h-goal', 'Ziel'),
      <Text key="goal" dimColor={!g} wrap="wrap">
        {g ? g.text : 'noch keins'}
      </Text>,
      gap('gap-todo'),
      head('h-todo', list.length > 0 ? `To-dos  ${done}/${list.length}` : 'To-dos'),
      list.length === 0 ? none('todo-none') : null,
      ...list.map((t, i) =>
        t.status === 'in_progress' ? (
          <Text key={`todo-${i}`} bold color="green" wrap="wrap">
            ▶ {t.activeForm || t.content}
          </Text>
        ) : (
          <Text key={`todo-${i}`} dimColor={t.status === 'completed'} wrap="wrap">
            {t.status === 'completed' ? '✓' : '○'} {t.content}
          </Text>
        ),
      ),
    ]

    if (rest) {
      const conn = byCount(rest[0])
      const sk = byCount(rest[1])
      const fl = rest[2]

      rows.push(
        gap('gap-conn'),
        head('h-conn', 'MCP-Server'),
        conn.length === 0 ? none('conn-none') : null,
        ...conn.map(([server, count]) => {
          const b = badge(server)
          return (
            <Box key={`conn-${server}`} columnGap={1}>
              <Text backgroundColor={b.color} color="black" bold>
                {` ${b.letter} `}
              </Text>
              <Text>{b.label}</Text>
              <Text dimColor>{count}×</Text>
            </Box>
          )
        }),
        gap('gap-skill'),
        head('h-skill', 'Skills'),
        sk.length === 0 ? none('skill-none') : null,
        ...sk.map(([name, count]) => countRow(`skill-${name}`, name, count)),
        gap('gap-files'),
        head('h-files', fl.length > 0 ? `Dateien  ${fl.length}` : 'Dateien'),
        fl.length === 0 ? none('files-none') : null,
        ...fl.map(f => (
          <Box key={`file-${f.path}`} columnGap={1}>
            <Text color={f.changes > 0 ? 'yellow' : undefined}>{f.changes > 0 ? '✎' : '·'}</Text>
            <Text wrap="truncate-start">{relative(f.path, cwd)}</Text>
            <Text dimColor>
              {[f.changes > 0 ? `geändert ${f.changes}×` : '', f.reads > 0 ? `gelesen ${f.reads}×` : '']
                .filter(Boolean)
                .join(', ')}
            </Text>
          </Box>
        )),
      )
    }

    return <Box flexDirection="column">{rows.filter(r => r !== null)}</Box>
  })
}
