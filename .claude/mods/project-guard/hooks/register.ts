import { atom, read, update, type EngineInterface, type Register } from 'claude-code'
import type { Guard } from '../types'
import { findForeign, type Project } from './match'

const CONTINUE = 'Hier weiter'
const CANCEL = 'Abbrechen'

const guard = atom({ plugin: 'project-guard', key: 'guard' } as const, { silenced: [] } as Guard)

async function enabled($: EngineInterface) {
  return (await $.store.get('enabled')) !== false
}

async function currentFolder($: EngineInterface) {
  const root = (await $.session.repo())?.root ?? (await $.session.root())
  return root.split('/').filter(Boolean).pop() ?? ''
}

async function log($: EngineInterface, ...fields: string[]) {
  const file = `${await $.env.get('HOME')}/.local/state/claude-project-guard/decisions.tsv`
  await $.process.run(['sh', '-c', 'mkdir -p "${1%/*}" && cat >>"$1"', 'sh', file], {
    stdin: `${[new Date().toISOString(), ...fields].join('\t')}\n`,
  })
}

type Verdict = { drop: string } | { context: string } | null

async function check($: EngineInterface, text: string): Promise<Verdict> {
  if (!(await enabled($))) return null
  const projects: Project[] = JSON.parse(await $.fs.read(`${$.plugin.root}/projects.json`))
  const hit = findForeign(projects, await currentFolder($), text)
  if (!hit || (await read($, guard)).silenced.includes(hit.project.folder)) return null

  const answer = await $.ui
    .ask(`Der Prompt klingt nach ${hit.project.folder} (${hit.project.description}). Hier senden?`, {
      options: [CONTINUE, CANCEL],
      header: 'Project guard',
    })
    .catch(() => CANCEL)
  const outcome = answer === CONTINUE ? 'continue' : answer === CANCEL ? 'cancel' : 'note'
  await log($, hit.project.folder, hit.keywords.join(','), outcome).catch(() => {})

  if (outcome === 'continue') {
    await update($, guard, g => ({ ...g, silenced: [...g.silenced, hit.project.folder] }))
    return null
  }
  if (outcome === 'note') return { context: `Answer of the user to the project-guard question: ${answer}` }
  return { drop: `Prompt gehört wohl nach ${hit.project.folder}.` }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'project-guard',
      description: 'Warns before a prompt goes to the wrong project session',
      argumentHint: '[on|off]',
    })
    return started
  })

  on('command.run', { command: 'project-guard' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'on' || arg === 'off') await $.store.set('enabled', arg === 'on')
    return { text: `Project guard: ${(await enabled($)) ? 'on' : 'off'}. Switch with /project-guard on or /project-guard off.` }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind !== 'composer' || e.command) return next(e)
    const verdict = await check($, e.text).catch(() => null)
    if (!verdict) return next(e)
    if ('drop' in verdict) return verdict
    return next({ ...e, context: [...(e.context ?? []), verdict.context] })
  })
}
