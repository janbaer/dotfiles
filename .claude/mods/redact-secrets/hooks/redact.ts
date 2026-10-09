const NAME = /TOKEN|PASSWORD|PWD/i
const NOT_SECRET = new Set(['PWD', 'OLDPWD'])
const MIN_LENGTH = 6

export type Block = { type: string; [field: string]: unknown }
export type Secrets = string[][]

export const secretsFrom = (env: string): Secrets =>
  env
    .split('\0')
    .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
    .filter(([name, value]) => NAME.test(name) && !NOT_SECRET.has(name) && value.length >= MIN_LENGTH)
    .sort((a, b) => b[1].length - a[1].length)

export const redact = (secrets: Secrets, block: Block): Block => {
  const scrub = (text: string) =>
    secrets.reduce((out, [name, value]) => out.split(value).join(`[REDACTED:${name}]`), text)

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
