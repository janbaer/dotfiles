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

const none = secretsFrom('')
const text = (value: string) => (redact(none, { type: 'text', text: value }) as { text: string }).text

test('redacts secret-looking names in docker exec env output, keeps the rest', () => {
  const output = [
    'PATH=/usr/local/bin:/usr/bin',
    'HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=correct-horse',
    'HERMES_DASHBOARD_BASIC_AUTH_SECRET=battery-staple',
    'API_KEY=abc123def456',
    'SSH_PUBLIC_KEY=ssh-ed25519 AAAA',
    'AWS_ACCESS_KEY_ID=AKIAEXAMPLE',
    'TOKEN_FILE=/run/secrets/token',
    'PWD=/app',
    'HOME=/root',
  ].join('\n')

  expect(text(output)).toEqual(
    [
      'PATH=/usr/local/bin:/usr/bin',
      'HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=[REDACTED:HERMES_DASHBOARD_BASIC_AUTH_PASSWORD]',
      'HERMES_DASHBOARD_BASIC_AUTH_SECRET=[REDACTED:HERMES_DASHBOARD_BASIC_AUTH_SECRET]',
      'API_KEY=[REDACTED:API_KEY]',
      'SSH_PUBLIC_KEY=ssh-ed25519 AAAA',
      'AWS_ACCESS_KEY_ID=AKIAEXAMPLE',
      'TOKEN_FILE=/run/secrets/token',
      'PWD=/app',
      'HOME=/root',
    ].join('\n'),
  )
})

test('redacts JSON and YAML forms, keeping quotes and names', () => {
  expect(text('{"db_password": "hunter2", "port": 5432, "api_token": "abc"}')).toEqual(
    '{"db_password": "[REDACTED:db_password]", "port": 5432, "api_token": "[REDACTED:api_token]"}',
  )
  expect(text('client_secret: s3cr3t\nname: web\nsecret: "quoted value"')).toEqual(
    'client_secret: [REDACTED:client_secret]\nname: web\nsecret: "[REDACTED:secret]"',
  )
})

test('leaves empty and boolean values and already redacted values alone', () => {
  expect(text('TOKEN=\nSECRET: true\nAPI_KEY=[REDACTED:API_KEY]')).toEqual('TOKEN=\nSECRET: true\nAPI_KEY=[REDACTED:API_KEY]')
})

test('redacts known token prefixes without a name', () => {
  const tokens = [
    'ghp_abcdefghijklmnopqrstuv',
    'github_pat_11ABCDEFG0abcdefghijkl_mnopqrstuvwxyz',
    'glpat-abcdefghij1234567890',
    'sk-abcdefghijklmnopqrstuvwx',
    'xoxb-1234567890-abcdefghijkl',
  ]

  tokens.forEach(token => expect(text(`curl -H "x: ${token}"`)).toEqual('curl -H "x: [REDACTED:TOKEN]"'))
  expect(text('task-force sk-short')).toEqual('task-force sk-short')
})

test('picks SECRET and KEY variables, skips public keys and key ids', () => {
  const env = ['APP_SECRET=abcdefgh', 'API_KEY=abcdefgh', 'SSH_PUBLIC_KEY=abcdefgh', 'KEY_ID=abcdefgh', ''].join('\0')

  expect(secretsFrom(env).map(([name]) => name)).toEqual(['APP_SECRET', 'API_KEY'])
})

test('keeps commas inside an unquoted value from leaking the rest', () => {
  expect(text('PASSWORD=ab,cd')).toEqual('PASSWORD=[REDACTED:PASSWORD]')
  expect(text('{"api_token": 123456, "port": 80}')).toEqual('{"api_token": [REDACTED:api_token], "port": 80}')
})

test('leaves non-secret names with key or tokens as a substring or plural alone', () => {
  const unchanged = [
    'primary_key: 42',
    'max_tokens=4096',
    'keybindings-help: Use when the user wants to customize keyboard shortcuts',
    'KEYBOARD_LAYOUT=german',
    'sortKey: name',
  ]

  unchanged.forEach(line => expect(text(line)).toEqual(line))
})

test('matches name segments, including camelCase', () => {
  expect(text('apiKey=abc123xyz')).toEqual('apiKey=[REDACTED:apiKey]')
  expect(text('AWS_SECRET_ACCESS_KEY=abc123xyz')).toEqual('AWS_SECRET_ACCESS_KEY=[REDACTED:AWS_SECRET_ACCESS_KEY]')
  expect(text('x-api-key: abc123xyz')).toEqual('x-api-key: [REDACTED:x-api-key]')
})

test('applies NAME: value only where a statement starts', () => {
  expect(text('the token: abc123xyz was shown')).toEqual('the token: abc123xyz was shown')
  expect(text('- password: hunter2')).toEqual('- password: [REDACTED:password]')
  expect(text('{"a": 1, "secret": "x1y2"}')).toEqual('{"a": 1, "secret": "[REDACTED:secret]"}')
})

test('does not pick KEYBOARD_LAYOUT or max_tokens from the env', () => {
  const env = ['KEYBOARD_LAYOUT=german', 'MAX_TOKENS=4096000', 'APP_TOKEN=abcdefgh', ''].join('\0')

  expect(secretsFrom(env).map(([name]) => name)).toEqual(['APP_TOKEN'])
})

test('finds a secret assignment inside the value of a non-secret one', () => {
  expect(text('camelCase: apiKey=dummycamelkey12345')).toEqual('camelCase: apiKey=[REDACTED:apiKey]')
  expect(text('command: TOKEN=abc123 ./run')).toEqual('command: TOKEN=[REDACTED:TOKEN] ./run')
})
