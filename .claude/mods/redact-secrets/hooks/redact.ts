const SECRET_WORDS = new Set(['PASSWORD', 'SECRET', 'TOKEN', 'KEY', 'PWD', 'APIKEY'])
const NOT_SECRET_NAME = /^(PWD|OLDPWD)$|(PUBLIC|PRIMARY|SORT|FOREIGN)_?KEY|KEY_?ID|_(FILE|PATH)$/i
const MIN_LENGTH = 6

const ASSIGNMENT = /(["']?)([A-Za-z_][\w.-]*)\1([ \t]*[=:][ \t]*)("[^"\n]*"|'[^'\n]*'|[^\s"']*[^\s"',}])/g
const TOKEN_PREFIX = /\b(?:ghp_|github_pat_|glpat-|sk-|xox[bp]-)[A-Za-z0-9_-]{16,}/g

const isSecretName = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .split(/[_.-]+/)
    .some(word => SECRET_WORDS.has(word.toUpperCase())) && !NOT_SECRET_NAME.test(name)

const startsStatement = (text: string, offset: number) =>
  /^[\s-]*$|[{,[]\s*$/.test(text.slice(text.lastIndexOf('\n', offset - 1) + 1, offset))

export type Block = { type: string; [field: string]: unknown }
export type Secrets = string[][]

export const secretsFrom = (env: string): Secrets =>
  env
    .split('\0')
    .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
    .filter(([name, value]) => isSecretName(name) && value.length >= MIN_LENGTH)
    .sort((a, b) => b[1].length - a[1].length)

const scrubAssignments = (text: string): string =>
  text.replace(ASSIGNMENT, (_match, quote: string, name: string, separator: string, value: string, offset: number) => {
    const head = `${quote}${name}${quote}${separator}`
    const bare = value.replace(/^["']|["']$/g, '')
    const skip =
      !isSecretName(name) ||
      /^(true|false|null)?$/i.test(bare) ||
      bare.startsWith('[REDACTED:') ||
      (separator.includes(':') && !startsStatement(text, offset))
    if (skip) return head + scrubAssignments(value)
    const mark = `[REDACTED:${name}]`
    return head + (/^["']/.test(value) ? `${value[0]}${mark}${value[0]}` : mark)
  })

const scrubPatterns = (text: string) => scrubAssignments(text).replace(TOKEN_PREFIX, '[REDACTED:TOKEN]')

export const redact = (secrets: Secrets, block: Block): Block => {
  const scrub = (text: string) =>
    scrubPatterns(secrets.reduce((out, [name, value]) => out.split(value).join(`[REDACTED:${name}]`), text))

  if (block.type === 'text' && typeof block.text === 'string') {
    return { ...block, text: scrub(block.text) }
  }
  if (block.type === 'tool_result' && typeof block.content === 'string') {
    return { ...block, content: scrub(block.content) }
  }
  if (block.type === 'tool_result' && Array.isArray(block.content)) {
    return { ...block, content: block.content.map(inner => redact(secrets, inner)) }
  }
  return block
}
