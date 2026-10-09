import { expect, test } from 'claude-code/testing'
import { redact, secretsFrom } from './redact'

const ENV = [
  'GH_TOKEN=ghp_abcdef123456',
  'DB_PWD=hunter2hunter2',
  'API_PASSWORD=short',
  'HOME=/home/jan',
  'PWD=/home/jan/Projects',
  '',
].join('\0')

test('picks TOKEN, PWD and PASSWORD variables of sufficient length', () => {
  expect(secretsFrom(ENV).map(([name]) => name)).toEqual(['GH_TOKEN', 'DB_PWD'])
})

test('replaces the values in a text block', () => {
  const block = { type: 'text', text: 'ghp_abcdef123456 hunter2hunter2 short /home/jan/Projects' }

  expect(redact(secretsFrom(ENV), block)).toEqual({
    type: 'text',
    text: '[REDACTED:GH_TOKEN] [REDACTED:DB_PWD] short /home/jan/Projects',
  })
})

test('replaces the values in a tool result, string or blocks', () => {
  const secrets = secretsFrom(ENV)

  expect(redact(secrets, { type: 'tool_result', tool_use_id: 't1', content: 'ghp_abcdef123456' })).toEqual({
    type: 'tool_result',
    tool_use_id: 't1',
    content: '[REDACTED:GH_TOKEN]',
  })
  expect(
    redact(secrets, { type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: 'ghp_abcdef123456' }] }),
  ).toEqual({ type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: '[REDACTED:GH_TOKEN]' }] })
})
