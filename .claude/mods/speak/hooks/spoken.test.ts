import { expect, test } from 'claude-code/testing'
import { toChunks, toSpeech } from './spoken'

test('drops code blocks and tables, keeps the prose', () => {
  const answer = [
    '## Ergebnis',
    '',
    'Der Build ist **grün**.',
    '',
    '```bash',
    'nix build .#foo',
    '```',
    '',
    '| Modell | Preis |',
    '| --- | --- |',
    '| Gemini | 0,50 |',
    '',
    '- Eintrag in `user-settings.json`',
  ].join('\n')

  expect(toSpeech(answer)).toBe(
    'Ergebnis. Der Build ist grün. Codeblock ausgelassen. Tabelle ausgelassen. Eintrag in user-settings.json.',
  )
})

test('reads link text, not URLs', () => {
  expect(toSpeech('Siehe [die Doku](https://openrouter.ai/docs) und https://example.com/x')).toBe(
    'Siehe die Doku und Link.',
  )
})

test('cuts long answers at a word boundary', () => {
  const speech = toSpeech('wort '.repeat(2000))

  expect(speech.endsWith('wort Der Rest ist gekürzt.')).toBe(true)
  expect(speech.length).toBeLessThan(4100)
})

test('cuts a long text without spaces at the limit, not one character short', () => {
  const speech = toSpeech('a'.repeat(5000))

  expect(speech.startsWith('a'.repeat(4000))).toBe(true)
  expect(speech.endsWith(' Der Rest ist gekürzt.')).toBe(true)
})

test('the first sentence is a chunk of its own, the rest is packed', () => {
  const sentence = 'Das ist ein Satz mit einigem Inhalt.'
  const chunks = toChunks(Array(20).fill(sentence).join(' '))

  expect(chunks[0]).toBe(sentence)
  expect(chunks.length).toBe(4)
  expect(chunks.every(chunk => chunk.length <= 280)).toBe(true)
  expect(chunks.join(' ')).toBe(Array(20).fill(sentence).join(' '))
})

test('a sentence without a stop is wrapped at a word boundary', () => {
  const chunks = toChunks('wort '.repeat(200).trim())

  expect(chunks.length).toBeGreaterThan(1)
  expect(chunks.every(chunk => chunk.length <= 280 && !chunk.startsWith(' '))).toBe(true)
  expect(chunks.join(' ')).toBe('wort '.repeat(200).trim())
})

test('nothing to say gives no chunks', () => {
  expect(toChunks('')).toEqual([])
})
