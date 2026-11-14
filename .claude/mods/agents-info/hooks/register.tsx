import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRun, Panel } from '../types'

const agents = atom({ plugin: 'agents-info', key: 'agents' } as const, [])
const panel = atom({ plugin: 'agents-info', key: 'panel' } as const, {
  isCompact: false,
  isDoneCollapsed: false,
  hasAutoOpened: false,
})
const now = atom({ plugin: 'agents-info', key: 'now' } as const, 0)

const PANE = 'agents-info'

// ---------------------------------------------------------------------------
// Language: the `language` option, else Claude Code's `language` setting, else the
// process locale; English when nothing says Hebrew or Russian.

type Lang = 'en' | 'de'

const STRINGS = {
  en: {
    pane: 'Agents',
    cost: 'Cost',
    tokens: 'Tokens',
    time: 'Time',
    collapse: 'Collapse',
    expand: 'Expand',
    running: 'Running',
    finished: 'Finished',
    empty: 'No subagents yet.',
    round: 'round',
    failed: 'error',
    tokensWord: 'tokens',
    agentsCount: 'agents',
    isRunning: 'running',
    isFinished: 'finished',
    opened: 'Agents panel opened.',
    closed: 'Agents panel closed.',
    ctx: 'ctx',
    effort: { low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' },
  },
  de: {
    pane: 'Agenten',
    cost: 'Kosten',
    tokens: 'Tokens',
    time: 'Zeit',
    collapse: 'Einklappen',
    expand: 'Ausklappen',
    running: 'Laufend',
    finished: 'Fertig',
    empty: 'Noch keine Subagenten.',
    round: 'Runde',
    failed: 'Fehler',
    tokensWord: 'Tokens',
    agentsCount: 'Agenten',
    isRunning: 'läuft',
    isFinished: 'fertig',
    opened: 'Agenten-Panel geöffnet.',
    closed: 'Agenten-Panel geschlossen.',
    ctx: 'Kontext',
    effort: { low: 'niedrig', medium: 'mittel', high: 'hoch', xhigh: 'sehr hoch', max: 'maximal' },
  },
} as const

// Module scope is fine here: session.start sets it again on every (re)load.
let lang: Lang = 'en'
const tr = () => STRINGS[lang]

// Cost is only shown when tokens are really billed: an API key, a custom endpoint
// (OpenRouter and the like) or a cloud provider. A subscription login pays no per-token price.
let isBilled = false

// The provider flags are on for "1" or "true"; "0" or "false" is a nonempty string that must not count.
const isFlagOn = (v: string | undefined): boolean => v !== undefined && !['', '0', 'false'].includes(v.trim().toLowerCase())

async function detectBilling($: EngineInterface): Promise<boolean> {
  return Boolean(
    (await $.env.get('ANTHROPIC_API_KEY')) ||
      (await $.env.get('ANTHROPIC_AUTH_TOKEN')) ||
      (await $.env.get('ANTHROPIC_BASE_URL')) ||
      isFlagOn(await $.env.get('CLAUDE_CODE_USE_BEDROCK')) ||
      isFlagOn(await $.env.get('CLAUDE_CODE_USE_VERTEX')) ||
      isFlagOn(await $.env.get('CLAUDE_CODE_USE_FOUNDRY')),
  )
}

const addCost = (sum: number | null, add: number | null): number | null => (sum === null || add === null ? null : sum + add)

const costText = (usd: number | null): string => (isBilled && usd !== null ? `≈${fmtCost(usd)}` : '')
const joinCost = (usd: number | null, ...rest: string[]): string => [costText(usd), ...rest].filter(Boolean).join(' · ')

// Effort words as shown; anything unknown shows as it came.
const effortWord = (effort: string): string => (tr().effort as Record<string, string>)[effort] ?? effort

const isGerman = (v: unknown): boolean => typeof v === 'string' && /^(de|german|deutsch)/i.test(v.trim())
const langOf = (v: unknown): Lang => (isGerman(v) ? 'de' : 'en')

async function detectLang($: EngineInterface, option: unknown): Promise<Lang> {
  if (option === 'en' || option === 'de') return option
  try {
    const settings = (await $.settings.read()) as Record<string, unknown>
    if (typeof settings.language === 'string' && settings.language.trim()) return langOf(settings.language)
  } catch {
    // No settings: fall through to the locale.
  }
  const locale = (await $.env.get('LC_ALL')) || (await $.env.get('LC_MESSAGES')) || (await $.env.get('LANG'))
  return langOf(locale)
}

const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif"

const xml = (s: string): string =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

// CJK, fullwidth forms and emoji advance about 1em; at 0.56em a Chinese title was sized at half its width and the bar drew over it.
const WIDE =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF01-\uFF60\uFFE0-\uFFE6\u{1F300}-\u{1FAFF}\u{20000}-\u{3FFFD}]/u

// Rough advance of system UI text, in em; good enough to size the title's slot.
const charEm = (ch: string): number =>
  WIDE.test(ch) ? 1 : /[\s.,:;'|!il1()[\]]/.test(ch) ? 0.3 : /[A-ZА-ЯЁmwшщжюМШЩЖЮ@%]/.test(ch) ? 0.72 : 0.56

const textWidth = (s: string, size: number): number => [...s].reduce((w, ch) => w + charEm(ch) * size, 0)

// Cuts `s` to fit `maxW` pixels, with an ellipsis when it had to cut.
const fitText = (s: string, size: number, maxW: number): string => {
  if (textWidth(s, size) <= maxW) return s
  let out = ''
  for (const ch of s) {
    if (textWidth(out + ch + '…', size) > maxW) break
    out += ch
  }
  return out + '…'
}

// ---------------------------------------------------------------------------
// Agents panel: every subagent of the session.

// A crab's role comes from the subagent's type and description, not from its model.
type Role = 'researcher' | 'planner' | 'reviewer' | 'writer' | 'designer' | 'builder' | 'other'

const ROLE_COLOR: Record<Role, string> = {
  researcher: '#378ADD',
  planner: '#7F77DD',
  reviewer: '#1D9E75',
  writer: '#D4537E',
  designer: '#2BB5C8',
  builder: '#BA7517',
  other: '#888780',
}

const ROLE_EMOJI: Record<Role, string> = {
  researcher: '🦀',
  planner: '🦉',
  reviewer: '🦞',
  writer: '🐙',
  designer: '🦑',
  builder: '🐝',
  other: '🐚',
}

const ROLE_TEXT = {
  de: {
    name: { researcher: 'Rechercheur', planner: 'Planer', reviewer: 'Prüfer', writer: 'Schreiber', designer: 'Gestalter', builder: 'Entwickler', other: 'Helfer' },
    doing: { researcher: 'recherchiert gerade', planner: 'plant gerade', reviewer: 'prüft gerade', writer: 'schreibt gerade', designer: 'gestaltet gerade', builder: 'entwickelt gerade', other: 'hilft gerade' },
  },
  en: {
    name: { researcher: 'Researcher', planner: 'Planner', reviewer: 'Reviewer', writer: 'Writer', designer: 'Designer', builder: 'Builder', other: 'Helper' },
    doing: { researcher: 'researching', planner: 'planning', reviewer: 'reviewing', writer: 'writing', designer: 'designing', builder: 'building', other: 'helping' },
  },
} as const

const roleText = () => ROLE_TEXT[lang]
const roleName = (r: Role): string => roleText().name[r]

// Types that name their job; a generic type falls through to the description.
const ROLE_BY_TYPE: Record<string, Role> = {
  explore: 'researcher',
  'web-fetch': 'researcher',
  'claude-code-guide': 'researcher',
  plan: 'planner',
  'code-reviewer': 'reviewer',
  'review-diff-executor': 'reviewer',
}

const wordStart = (words: string[]): RegExp => new RegExp(`(?<![a-zäöüß])(${words.join('|')})`, 'i')

// The first match wins, so "review the docs" is a reviewer, not a writer.
const ROLE_KEYWORDS: [Role, RegExp][] = [
  ['reviewer', wordStart(['prüf', 'pruef', 'review', 'kontroll', 'audit', 'verif', 'validier'])],
  ['designer', wordStart(['design', 'gestalt', 'layout', 'ui\\b', 'ux\\b', 'css', 'styl', 'icon', 'logo', 'mockup', 'farb', 'color', 'theme', 'svg'])],
  ['writer', wordStart(['doku', 'docs?\\b', 'readme', 'changelog', 'schreib', 'prosa', 'artikel', 'übersetz', 'translat', 'write-?up', 'document', 'zusammenfass', 'summar'])],
  ['planner', wordStart(['plan', 'konzept', 'architekt', 'strateg', 'roadmap', 'aufteil', 'breakdown'])],
  ['researcher', wordStart(['recherch', 'research', 'suche', 'search', 'find', 'explor', 'untersuch', 'investigat', 'analy', 'survey', 'trace', 'erkund', 'herausfind', 'inventar'])],
  ['builder', wordStart(['implement', 'bau', 'build', 'fix', 'refactor', 'migrat', 'umsetz', 'entwickl', 'install', 'konfigur', 'deploy', 'erstell', 'create'])],
]

const roleOf = (type: string, description: string): Role => {
  const bare = type.replace(/^[^:]*:/, '').toLowerCase()
  return ROLE_BY_TYPE[bare] ?? ROLE_KEYWORDS.find(([, re]) => re.test(description))?.[0] ?? 'other'
}

const roleOfRun = (a: AgentRun): Role => roleOf(a.type, a.description)

const colorOf = (role: Role): string => ROLE_COLOR[role]

// What a running, finished or failed run says about itself.
const doingOf = (a: AgentRun, role: Role): string =>
  a.status === 'running' ? roleText().doing[role] : a.status === 'failed' ? tr().failed : tr().isFinished

// "Opus 5.5 · low" for a run, or just the model when no effort was seen.
const runModel = (a: AgentRun): string => (a.effort ? `${modelName(a.model)} · ${effortWord(a.effort)}` : modelName(a.model))

// USD per million tokens: input, output, cache read, cache write. A row matches only the
// releases it names, with an optional date suffix or provider prefix; any other release
// has no price and its cost is not shown. The first matching row wins.
// The engine reports tokens, not money, so the panel's cost is an estimate. It reports
// one cache-write count with no split by lifetime; writes are priced at the 1-hour
// rate (2x input), which is what Claude Code writes on a subscription.
type Price = [input: number, output: number, cacheRead: number, cacheWrite: number]

const release = (family: string, ...versions: string[]): RegExp =>
  new RegExp(`(?:${versions.map(v => `${family}-${v}`).join('|')})(?:$|[@\\[:]|-\\d{8})`)

const HAIKU_5_5 = release('haiku', '5-5')

const PRICES: [RegExp, Price][] = [
  [release('(?:fable|mythos)', '5-1'), [10, 50, 0.25, 20]],
  [release('(?:fable|mythos)', '5'), [10, 50, 1, 20]],
  [release('opus', '5-5'), [4, 20, 0.2, 8]],
  [release('opus', '5', '4-8'), [5, 25, 0.5, 10]],
  [release('sonnet', '5-5'), [2, 10, 0.1, 4]],
  [release('sonnet', '5'), [2, 10, 0.2, 4]],
  [release('sonnet', '4-6'), [3, 15, 0.3, 6]],
  [HAIKU_5_5, [0.1, 0.5, 0.01, 0.2]],
  [release('haiku', '4-5'), [1, 5, 0.1, 2]],
]

// Haiku 5.5 is priced by prompt length: a request whose prompt (input, cache reads and
// cache writes together) is over 100,000 tokens pays these prices instead.
const HAIKU_LONG_PROMPT = 100_000
const HAIKU_LONG: Price = [0.5, 2.5, 0.05, 1]

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

// null for a model the table does not know: its cost is not shown rather than guessed.
const priceOf = (model: string, prompt: number): Price | null => {
  const id = model.toLowerCase()
  const price = PRICES.find(([re]) => re.test(id))?.[1] ?? null
  return price && prompt > HAIKU_LONG_PROMPT && HAIKU_5_5.test(id) ? HAIKU_LONG : price
}

const totalTokens = (u: Usage): number =>
  (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)

// `isRequest` says the usage is one model request, which is what a prompt-length price
// is set by; a turn's sum is priced at the model's ordinary prices.
const costOf = (model: string, u: Usage, isRequest: boolean): number | null => {
  const prompt = isRequest ? (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) : 0
  const price = priceOf(model, prompt)
  if (!price) return null
  const [i, o, r, w] = price
  return (
    ((u.input_tokens || 0) * i +
      (u.output_tokens || 0) * o +
      (u.cache_read_input_tokens || 0) * r +
      (u.cache_creation_input_tokens || 0) * w) /
    1e6
  )
}

// Haiku 4.5 and the Claude 3 models have a 200K window; the rest, Haiku 5.5 included, 1M.
const windowOf = (model: string): number => (/haiku-4|claude-3/i.test(model) ? 200_000 : 1_000_000)

const modelName = (id: string): string => {
  const m = /(fable|mythos|opus|sonnet|haiku)-(\d+)(?:-(\d{1,2})(?!\d))?/i.exec(id)
  const [, family = '', major = '', minor] = m ?? []
  if (!family) return id.replace(/^claude-/, '').replace(/\[.*\]$/, '') || '—'
  return `${family.charAt(0).toUpperCase()}${family.slice(1).toLowerCase()} ${major}${minor ? '.' + minor : ''}`
}

const norm = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const fmtTokens = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${Math.round(n)}`

const fmtCost = (usd: number): string => `$${usd < 10 ? usd.toFixed(2) : usd.toFixed(1)}`

const fmtTime = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

const endOf = (a: AgentRun, at: number): number => a.endedAt ?? Math.max(at, a.startedAt)

const elapsed = (a: AgentRun, at: number): number => endOf(a, at) - a.startedAt

const totals = (list: AgentRun[], at: number) => {
  const priced = list.filter(a => a.costUsd !== null)
  const cost = priced.length ? priced.reduce((s, a) => s + (a.costUsd ?? 0), 0) : null
  const tokens = list.reduce((s, a) => s + a.tokens, 0)
  const start = Math.min(...list.map(a => a.startedAt))
  const end = Math.max(...list.map(a => endOf(a, at)))
  return { cost, tokens, time: list.length ? end - start : 0 }
}

// --- desktop drawings: each row is one SVG, as the band above the prompt is.

// The pane's backdrop: a dotted grid as tall as the content laid over it; the
// row SVGs are transparent, so it shows through between their marks.
const GRID_STEP = 16
// A Text or Button row on the desktop is about 20px; the grid errs taller.
const LINE_H = 24
// The engine refuses an Svg taller than 4096px, so a long grid is stacked from
// tiles of at most this height; a multiple of GRID_STEP keeps the dots aligned.
const GRID_TILE = 4096
const gridTiles = (H: number) => Array.from({ length: Math.ceil(H / GRID_TILE) }, (_, i) => Math.min(GRID_TILE, H - i * GRID_TILE))
const gridSvg = (W: number, H: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>.d{fill:#d9d8d4}@media (prefers-color-scheme: dark){.d{fill:#3a3a38}}</style>
<defs><pattern id="g" width="${GRID_STEP}" height="${GRID_STEP}" patternUnits="userSpaceOnUse"><circle class="d" cx="${GRID_STEP / 2}" cy="${GRID_STEP / 2}" r="1"/></pattern></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`

const PANE_CSS = `<style>
.t{fill:#1f1f1f}.s{fill:#6b6b68}.m{fill:#9a9a96}.k{fill:#ecebe8}.ln{stroke:#e4e4e1}.tile{fill:#f4f3f0}
@media (prefers-color-scheme: dark){.t{fill:#ececec}.s{fill:#a8a8a4}.m{fill:#7d7d79}.k{fill:#2c2c2b}.ln{stroke:#333331}.tile{fill:#262625}}
.live{animation:p 1.6s ease-in-out infinite}@keyframes p{50%{opacity:.3}}
@media (prefers-reduced-motion: reduce){.live{animation:none}}
</style>`

// Pixel Clawd from DockCrab (Clawdy): a 24×18 crab on a 30×28 grid, one costume per role.
// The body keeps the brand clay; the role's color lives in the costume's accent.
const CLAY = '#D97757'
const INK = '#1F1E1D'

// `cls` puts a pixel in a named group: `bd` (the default) is the body and its
// costume, `la`/`lb` the leg pairs, anything else a prop with its own motion.
type Fill = (x: number, y: number, w: number, h: number, c: string, cls?: string) => void

const stamp = (f: Fill, x: number, y: number, rows: string[], map: Record<string, string>, cls?: string): void =>
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      const c = map[ch]
      if (c) f(x + dx, y + dy, 1, 1, c, cls)
    }),
  )

// `armCls` lets a raised claw travel with the prop it holds.
const crabBody = (f: Fill, armFront = 0, armCls?: string): void => {
  f(7, 10, 16, 12, CLAY)
  f(3, 14, 4, 4, CLAY)
  f(23, 14 + armFront, 4, 4, CLAY, armCls)
  f(9, 12, 2, 2, INK)
  f(19, 12, 2, 2, INK)
  f(7, 22, 2, 4, CLAY, 'la')
  f(17, 22, 2, 4, CLAY, 'la')
  f(11, 22, 2, 4, CLAY, 'lb')
  f(21, 22, 2, 4, CLAY, 'lb')
}

// Pure CSS, run by the compositor: no redraws. Periods divide one second, so the
// once-a-second redraw of a running row restarts them in phase. Every crab walks;
// each costume adds its prop's own motion on top.
const CRAB_CSS = `<style>
.run .la{animation:st .5s steps(1) infinite}.run .lb{animation:st .5s steps(1) infinite -.25s}
.run .bd{animation:bob .5s steps(1) infinite -.125s}
.run g{transform-box:fill-box}
@keyframes st{50%{transform:translateY(-1px)}}@keyframes bob{50%{transform:translateY(1px)}}
.c-researcher.run .it{animation:scan 1s steps(1) infinite}
.c-researcher.run .gl{animation:blink 1s steps(1) infinite -.5s}
@keyframes scan{25%{transform:translate(-1px,1px)}50%{transform:translate(-2px,2px)}75%{transform:translate(-1px,1px)}}@keyframes blink{50%{opacity:.15}}
.c-builder.run .it{transform-origin:100% 100%;animation:twist .5s ease-in-out infinite}
@keyframes twist{50%{transform:rotate(-35deg)}}
.c-planner.run .bulb{animation:blink 1s steps(1) infinite}
.c-planner.run .it{transform-origin:0 100%;animation:tilt 1s ease-in-out infinite}
.c-reviewer.run .it{animation:tap .5s steps(1) infinite}
@keyframes tap{50%{transform:translateY(-2px)}}
.c-writer.run .pen{transform-origin:50% 100%;animation:scribble .5s steps(1) infinite}
@keyframes scribble{50%{transform:translateX(1px) rotate(10deg)}}
.c-designer.run .pal{transform-origin:0 50%;animation:tilt 1s ease-in-out infinite}
@keyframes tilt{20%,40%{transform:rotate(-12deg)}}
@media (prefers-reduced-motion: reduce){.run,.run g{animation:none!important}}
</style>`

const COSTUMES: Record<Role, (f: Fill, t: string) => void> = {
  // Researcher: detective with a deerstalker; the magnifier sweeps and glints.
  researcher: (f, t) => {
    crabBody(f, -4, 'it')
    stamp(f, 6, 3, ['......bbbbbb......', '....bbcbbcbbbb....', '...bbbbbbbbbbbb...', '..bcbbcbbcbbcbbb..', '.bbbbbbbbbbbbbbbb.', 'dddddddddddddddddd'], { b: '#7A4A26', c: '#A0703F', d: '#5A3519' })
    f(6, 9, 18, 1, t)
    stamp(f, 23, 1, ['.kkk.', 'k...k', 'k...k', 'k...k', '.kkk.'], { k: '#3A3A3C' }, 'it')
    f(24, 2, 3, 3, 'rgba(169,214,245,.7)', 'it'); f(25, 6, 1, 4, '#7A4A26', 'it'); f(24, 2, 1, 1, '#fff', 'gl')
  },
  // Planner: a rolled blueprint in the claw, a lightbulb over the head that blinks.
  planner: (f, t) => {
    crabBody(f, -4, 'it')
    stamp(f, 6, 5, ['.....vvvvvvvv.....', '...vvvvvvvvvvvv...', '..vvvvvvvvvvvvvv..', '.vvvvvvvvvvvvvvvv.', 'dddddddddddddddddd'], { v: t, d: '#4F4AA8' })
    stamp(f, 13, 0, ['.yyy.', 'yyyyy', 'yyyyy', '.yyy.', '..g..'], { y: '#F5C542', g: '#8E929A' }, 'bulb')
    f(22, 5, 7, 5, t, 'it'); f(23, 6, 5, 1, '#E6EEFF', 'it'); f(23, 8, 5, 1, '#E6EEFF', 'it'); f(22, 5, 1, 5, '#F8F6F1', 'it')
  },
  // Reviewer: green eyeshade, a clipboard with a check mark that taps.
  reviewer: (f, t) => {
    crabBody(f, -4, 'it')
    stamp(f, 7, 5, ['..gggggggggggg..', '.gggggggggggggg.', 'gggggggggggggggg'], { g: t })
    f(6, 8, 18, 1, '#0F6E56')
    f(23, 2, 6, 8, '#8B5E34', 'it'); f(24, 3, 4, 6, '#F8F6F1', 'it')
    f(25, 6, 1, 1, t, 'it'); f(26, 7, 1, 1, t, 'it'); f(27, 5, 1, 2, t, 'it')
  },
  // Writer: round glasses, a pencil in the claw that scribbles.
  writer: (f, t) => {
    crabBody(f, -4, 'pen')
    stamp(f, 8, 11, ['kkkk', 'k..k', 'k..k', 'kkkk'], { k: t })
    stamp(f, 18, 11, ['kkkk', 'k..k', 'k..k', 'kkkk'], { k: t })
    f(12, 12, 6, 1, t)
    f(25, 1, 2, 1, '#E8838F', 'pen'); f(25, 2, 2, 6, '#F5C542', 'pen'); f(25, 8, 2, 1, '#E8B58A', 'pen'); f(25, 9, 1, 1, INK, 'pen')
  },
  // Designer: beret in the role color, a palette that dabs.
  designer: (f, t) => {
    crabBody(f, -4, 'pal')
    stamp(f, 6, 4, ['......rrrrrr......', '....rrrrrrrrrr....', '..rrrrrrrrrrrrrr..', '.rrrrrrrrrrrrrrrr.', 'rrrrrrrrrrrrrrrrrr', '.dddddddddddddddd.'], { r: t, d: '#1B7F8E' })
    f(14, 2, 3, 2, t)
    stamp(f, 22, 3, ['.bbbbb.', 'bbrbgbb', 'bbbbbbb', 'bubbybb', '.bbbbb.'], { b: '#D9B68A', r: '#D0453F', g: '#3B9C5F', u: '#378ADD', y: '#F5C542' }, 'pal')
  },
  // Builder: engineer in a hard hat; the wrench turns a bolt.
  builder: (f, t) => {
    crabBody(f)
    stamp(f, 6, 4, ['.....yyyyyyyy.....', '...yyyyyhhyyyyy...', '..yyyyyyhhyyyyyy..', '..yyyyyyhhyyyyyy..', '.yyyyyyyhhyyyyyyy.', 'dddddddddddddddddd'], { y: '#F5C542', h: '#FBE08A', d: '#C99A1E' })
    f(13, 5, 4, 2, t)
    stamp(f, 0, 10, ['.s.s', 'sss.', '.s..', '.s..'], { s: '#8E929A' }, 'it')
  },
  other: f => crabBody(f),
}

const CRAB_SCALE = 1.1

// Body and props nest inside `bd` so a prop rides the bob and adds its own motion;
// legs stay outside it and step on their own.
const crab = (x: number, y: number, costume: Role, isWalking = false): string => {
  const groups = new Map<string, string[]>([['bd', []]])
  const f: Fill = (cx, cy, w, h, c, cls = 'bd') => {
    if (!groups.has(cls)) groups.set(cls, [])
    groups.get(cls)?.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${c}"/>`)
  }
  COSTUMES[costume](f, colorOf(costume))
  const group = (cls: string) => `<g class="${cls}">${(groups.get(cls) ?? []).join('')}</g>`
  const props = [...groups.keys()].filter(k => k !== 'bd' && k !== 'la' && k !== 'lb')
  const body = `<g class="bd">${(groups.get('bd') ?? []).join('')}${props.map(group).join('')}</g>`
  return `<g transform="translate(${x},${y}) scale(${CRAB_SCALE})" shape-rendering="crispEdges"><g class="c-${costume}${isWalking ? ' run' : ''}">${body}${group('la')}${group('lb')}</g></g>`
}

const statusMark = (x: number, y: number, status: string, color: string): string => {
  if (status === 'running') return `<circle class="live" cx="${x}" cy="${y}" r="3.5" fill="${color}"/>`
  if (status === 'done') return `<path d="M${x - 5} ${y}l3.5 3.5 6.5-7" fill="none" stroke="#3B9C5F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  return `<path d="M${x - 4} ${y - 4}l8 8M${x + 4} ${y - 4}l-8 8" stroke="#D0453F" stroke-width="1.8" stroke-linecap="round"/>`
}

const svg = (W: number, H: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${PANE_CSS}${CRAB_CSS}${body}</svg>`

const headerSvg = (W: number, t: ReturnType<typeof totals>): string => {
  const s = tr()
  const gap = 6
  const hasCost = isBilled && t.cost !== null
  const count = hasCost ? 3 : 2
  const tw = (W - gap * (count - 1)) / count
  const tile = (i: number, k: string, v: string) =>
    `<rect class="tile" x="${i * (tw + gap)}" y="0" width="${tw}" height="40" rx="8"/>
<text class="s" x="${i * (tw + gap) + 9}" y="16" font-family="${FONT}" font-size="11">${k}</text>
<text class="t" x="${i * (tw + gap) + 9}" y="33" font-family="${FONT}" font-size="15" font-weight="600" font-variant-numeric="tabular-nums">${v}</text>`
  return svg(
    W,
    HEADER_H,
    `${hasCost ? tile(0, s.cost, costText(t.cost)) : ''}${tile(count - 2, s.tokens, fmtTokens(t.tokens))}${tile(count - 1, s.time, fmtTime(t.time))}`,
  )
}

const HEADER_H = 44

const ctxOf = (a: AgentRun): number => (a.contextMax ? Math.min(100, Math.round((a.contextTokens / a.contextMax) * 100)) : 0)

const agentSvg = (W: number, a: AgentRun, at: number): string => {
  const s = tr()
  const role = roleOfRun(a)
  const color = colorOf(role)
  const ctx = ctxOf(a)
  const textW = W - 42 - 22
  const meta = [doingOf(a, role), runModel(a)]
  if (a.round > 1) meta.push(`${s.round} ${a.round}`)
  const isDone = a.status === 'done'
  const stats = [`${s.ctx} ${ctx}% · ${fmtTokens(a.contextTokens)}`, costText(a.costUsd), fmtTime(elapsed(a, at))].filter(Boolean).join('  ')
  const fillW = Math.round(textW * (isDone ? 1 : ctx / 100))
  return svg(
    W,
    66,
    `${crab(0, 14, role, a.status === 'running')}
<text class="t" x="42" y="18" font-family="${FONT}" font-size="13" font-weight="600">${xml(fitText(a.description || a.type, 13, textW))}</text>
<text x="42" y="34" font-family="${FONT}" font-size="11"><tspan fill="${color}">${xml(roleName(role))}</tspan><tspan class="s">  ${xml(meta.join('  ·  '))}</tspan></text>
<text class="s" x="${42 + textW}" y="49" text-anchor="end" font-family="${FONT}" font-size="11" font-variant-numeric="tabular-nums">${stats}</text>
<rect class="k" x="42" y="55" width="${textW}" height="4" rx="2"/><rect${isDone ? '' : ' class="m"'} x="42" y="55" width="${fillW}" height="4" rx="2"${isDone ? ` fill="${color}"` : ''}/>
${statusMark(W - 8, 16, a.status, color)}
<line class="ln" x1="0" y1="65.5" x2="${W}" y2="65.5"/>`,
  )
}

const compactSvg = (W: number, list: AgentRun[], t: ReturnType<typeof totals>): string => {
  const fit = Math.max(1, Math.floor((W - 150) / 36))
  const shown = list.slice(0, fit)
  const more = list.length - shown.length
  const body = shown
    .map((a, i) => {
      const role = roleOfRun(a)
      return crab(i * 36, 0, role, a.status === 'running') + (a.status === 'running' ? `<circle class="live" cx="${i * 36 + 32}" cy="4" r="3" fill="${colorOf(role)}"/>` : '')
    })
    .join('')
  const x = shown.length * 36 + (more ? 4 : 0)
  return svg(
    W,
    32,
    `${body}${more ? `<text class="s" x="${x}" y="21" font-family="${FONT}" font-size="12">+${more}</text>` : ''}
<text class="s" x="${W}" y="21" text-anchor="end" font-family="${FONT}" font-size="12" font-variant-numeric="tabular-nums">${joinCost(t.cost, fmtTokens(t.tokens), fmtTime(t.time))}</text>`,
  )
}

// --- terminal drawing: the same rows in text.

const ctxBar = (pct: number, width: number): string => {
  const filled = Math.round((width * pct) / 100)
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled))
}

const STATUS_GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗' }

async function openPane($: EngineInterface): Promise<void> {
  const at = await $.clock.now()
  await update($, now, () => at)
  await $.ui.open({ id: PANE, title: tr().pane })
}

// Opens the agents pane, or closes it when it is up; true when it ends up open.
async function togglePane($: EngineInterface): Promise<boolean> {
  const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
  if (isOpen) {
    await $.ui.close({ id: PANE })
    return false
  }
  await openPane($)
  return true
}

async function autoOpen($: EngineInterface): Promise<void> {
  const p = await read($, panel)
  if (p.hasAutoOpened) return
  await update($, panel, prev => ({ ...prev, hasAutoOpened: true }))
  void $.ui.open({ id: PANE, title: tr().pane })
}

export const register: Register = (on, options) => {
  let version = ''
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    version = JSON.parse(await $.fs.read(`${$.plugin.root}/.claude-plugin/plugin.json`)).version
    lang = await detectLang($, options.language)
    isBilled = await detectBilling($)
    await $.command.register({
      name: 'agents-info',
      description:
        lang === 'de'
          ? 'Agenten-Panel ein- oder ausblenden: laufende und fertige Subagenten mit Modell, Kontext, Kosten und Zeit'
          : 'Show or hide the panel of subagents: running and finished, with model, context, cost and time',
    })

    // Ticks the running agents' clocks; quiet when nothing runs.
    $.clock.every(1000, () => {
      void (async () => {
        const list = await read($, agents)
        if (!list.some(a => a.status === 'running')) return
        const at = await $.clock.now()
        await update($, now, () => at)
      })()
    })
    return started
  })

  on('command.run', { command: 'agents-info' }, async ($, e) => {
    // `/agents-info open` opens the panel, or brings it forward from behind another tab, without toggling it.
    if ((e.args ?? '').trim() === 'open') {
      await openPane($)
      return { text: tr().opened }
    }
    const isOpen = await togglePane($)
    return { text: isOpen ? tr().opened : tr().closed }
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined) return started

    const at = await $.clock.now()
    await update($, agents, list => {
      const round = 1 + list.filter(a => norm(a.description) === norm(e.description) && e.description).length
      const run: AgentRun = {
        id: started.agentId ?? e.tool_use_id,
        agentId: started.agentId,
        type: e.subagentType,
        description: e.description,
        model: started.model,
        status: 'running',
        startedAt: at,
        contextTokens: 0,
        contextMax: windowOf(started.model),
        tokens: 0,
        costUsd: priceOf(started.model, 0) ? 0 : null,
        steps: 0,
        round,
      }
      return [...list.filter(a => a.id !== run.id), run].slice(-200)
    })
    await update($, now, () => at)
    await autoOpen($)
    return started
  })

  // Each model request of a subagent: live context, tokens and cost.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const agentId = e.agentId
    const usage = result.usage
    if (!agentId || !usage) return result

    const model = usage.model || e.model
    await update($, agents, list =>
      list.map((a): AgentRun =>
        a.agentId !== agentId
          ? a
          : {
              ...a,
              model,
              effort: typeof e.effort === 'string' ? e.effort : a.effort,
              status: 'running',
              endedAt: undefined,
              contextTokens: totalTokens(usage),
              contextMax: windowOf(model),
              tokens: a.tokens + totalTokens(usage),
              costUsd: addCost(a.costUsd, costOf(model, usage, true)),
              steps: a.steps + 1,
            },
      ),
    )
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId) {
      const at = await $.clock.now()
      await update($, agents, list =>
        list.map((a): AgentRun => {
          if (a.agentId !== agentId) return a
          // A run whose steps went unseen still gets the turn's own sum.
          const fallback = a.steps === 0 && e.usage
          return {
            ...a,
            status: e.reason === 'answer' ? 'done' : 'failed',
            endedAt: at,
            ...(fallback && e.usage
              ? {
                  model: e.usage.model || a.model,
                  tokens: totalTokens(e.usage),
                  costUsd: costOf(e.usage.model || a.model, e.usage, false),
                }
              : {}),
          }
        }),
      )
      await update($, now, () => at)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = tr()
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const list = await read($, agents)
    const p: Panel = await read($, panel)
    const at = Math.max(await read($, now), ...list.map(a => a.startedAt), 0)

    const running = list.filter(a => a.status === 'running').reverse()
    const finished = list.filter(a => a.status !== 'running').reverse()
    const t = totals(list, at)

    const toggleCompact = (
      <Button
        key="compact"
        label={p.isCompact ? s.expand : s.collapse}
        plain
        onPress={() => update($, panel, prev => ({ ...prev, isCompact: !prev.isCompact }))}
      />
    )
    const toggleDone = (
      <Button
        key="done"
        label={`${p.isDoneCollapsed ? '▸' : '▾'} ${s.finished} · ${finished.length}`}
        plain
        onPress={() => update($, panel, prev => ({ ...prev, isDoneCollapsed: !prev.isDoneCollapsed }))}
      />
    )
    const isEmpty = list.length === 0
    const summary = [costText(t.cost), `${fmtTokens(t.tokens)} ${s.tokensWord}`, fmtTime(t.time)].filter(Boolean).join(', ')

    if (e.surface === 'desktop' && 'Svg' in ui) {
      const { Svg } = ui
      const W = Math.max(240, Math.min(900, (e.props.bodyColumns || 40) * 8 - 8))
      const section = (key: string, text: string) => (
        <Text key={key} dimColor>
          {text}
        </Text>
      )

      if (p.isCompact) {
        return (
          <Box flexDirection="column" gap={1}>
            <Svg source={compactSvg(W, [...running, ...finished], t)} alt={`${list.length} ${s.agentsCount}, ${summary}`} width={W} height={32} />
            {toggleCompact}
          </Box>
        )
      }
      const shownDone = p.isDoneCollapsed ? 0 : finished.length
      const lines = 1 + (isEmpty ? 1 : 0) + (running.length > 0 ? 1 : 0) + (finished.length > 0 ? 1 : 0)
      const gridH = HEADER_H + lines * LINE_H + (running.length + shownDone) * 66
      return (
        <Box flexDirection="column">
          {/* The grid sizes the pane; the content is placed over it, as an
              absolute Box paints over the siblings before it. */}
          {gridTiles(gridH).map((tileH, i) => (
            <Svg key={`grid-${i}`} source={gridSvg(W, tileH)} alt="dotted grid" width={W} height={tileH} />
          ))}
          <Box flexDirection="column" position="absolute" top={0} left={0} right={0}>
            <Svg source={headerSvg(W, t)} alt={summary} width={W} height={HEADER_H} />
            {toggleCompact}
            {isEmpty && <Text dimColor>{s.empty}</Text>}
            {running.length > 0 && section('h-run', `${s.running} · ${running.length}`)}
            {running.map(a => (
              <Svg key={a.id} source={agentSvg(W, a, at)} alt={`${a.description}: ${modelName(a.model)}, ${s.isRunning}`} width={W} height={66} />
            ))}
            {finished.length > 0 && toggleDone}
            {!p.isDoneCollapsed &&
              finished.map(a => (
                <Svg key={a.id} source={agentSvg(W, a, at)} alt={`${a.description}: ${modelName(a.model)}, ${s.isFinished}`} width={W} height={66} />
              ))}
          </Box>
        </Box>
      )
    }

    // Terminal: the same content in text rows.
    const cols = Math.max(24, e.props.bodyColumns || 40)
    const barW = Math.max(6, Math.min(20, cols - 34))
    const row = (a: AgentRun) => {
      const role = roleOfRun(a)
      const color = colorOf(role)
      const ctx = ctxOf(a)
      const isDone = a.status === 'done'
      const model = runModel(a)
      return (
        <Box key={a.id} flexDirection="column" marginBottom={1}>
          <Box flexDirection="row" gap={1}>
            <Text>{ROLE_EMOJI[role]}</Text>
            <Text bold wrap="truncate-end">
              {a.description || a.type}
            </Text>
            <Text color={a.status === 'failed' ? 'red' : a.status === 'done' ? 'green' : color}>{STATUS_GLYPH[a.status]}</Text>
          </Box>
          <Text dimColor wrap="truncate-end">
            {'  '}
            {roleName(role)} · {doingOf(a, role)} · {model}
            {a.round > 1 ? ` · ${s.round} ${a.round}` : ''}
          </Text>
          <Text wrap="truncate-end">
            {'  '}
            {isDone ? <Text color={color}>{ctxBar(100, barW)}</Text> : <Text dimColor>{ctxBar(ctx, barW)}</Text>}
            <Text dimColor>
              {' '}
              {s.ctx} {ctx}% · {fmtTokens(a.contextTokens)} {costText(a.costUsd)} {fmtTime(elapsed(a, at))}
            </Text>
          </Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between">
          <Box gap={1}>
            <Text bold>{s.pane}</Text>
            <Text dimColor>v{version}</Text>
          </Box>
          {toggleCompact}
        </Box>
        <Text dimColor>
          {joinCost(t.cost, `${fmtTokens(t.tokens)} ${s.tokensWord}`, fmtTime(t.time))}
        </Text>
        {p.isCompact ? (
          <Text wrap="truncate-end">
            {[...running, ...finished].map(a => (
              <Text key={a.id} color={colorOf(roleOfRun(a))}>
                {ROLE_EMOJI[roleOfRun(a)]}{' '}
              </Text>
            ))}
          </Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {isEmpty && <Text dimColor>{s.empty}</Text>}
            {running.length > 0 && <Text dimColor>{s.running} · {running.length}</Text>}
            {running.map(row)}
            {finished.length > 0 && toggleDone}
            {!p.isDoneCollapsed && finished.map(row)}
          </Box>
        )}
      </Box>
    )
  })
}
