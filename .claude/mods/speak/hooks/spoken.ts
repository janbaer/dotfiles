const MAX_CHARS = 4000
const MAX_CHUNK = 280

const line = (text: string) => {
  const plain = text
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'Link')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/(^|\s)[*_]([^*_\s][^*_]*)[*_](?=\s|[.,:;!?]|$)/g, '$1$2')
    .trim()

  return plain && !/[.!?:;,]$/.test(plain) ? `${plain}.` : plain
}

export const toSpeech = (markdown: string) => {
  const parts: string[] = []
  let isInCode = false
  let isInTable = false

  for (const raw of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) {
      if (!isInCode) parts.push('Codeblock ausgelassen.')
      isInCode = !isInCode
      continue
    }
    if (isInCode) continue

    if (/^\s*\|/.test(raw)) {
      if (!isInTable) parts.push('Tabelle ausgelassen.')
      isInTable = true
      continue
    }
    isInTable = false

    if (/^\s*(---+|\*\*\*+)\s*$/.test(raw)) continue
    const text = line(raw)
    if (text) parts.push(text)
  }

  const speech = parts.join(' ')
  return speech.length > MAX_CHARS
    ? `${speech.slice(0, cutAt(speech))} Der Rest ist gekürzt.`
    : speech
}

const cutAt = (text: string) => {
  const cut = text.lastIndexOf(' ', MAX_CHARS)
  return cut > 0 ? cut : MAX_CHARS
}

const wrap = (sentence: string) => {
  const pieces: string[] = []
  let rest = sentence
  while (rest.length > MAX_CHUNK) {
    const cut = rest.lastIndexOf(' ', MAX_CHUNK)
    pieces.push(rest.slice(0, cut > 0 ? cut : MAX_CHUNK))
    rest = rest.slice(cut > 0 ? cut + 1 : MAX_CHUNK)
  }
  pieces.push(rest)

  return pieces
}

export const toChunks = (speech: string) => {
  const [first, ...rest] = speech
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .flatMap(wrap)
  if (first === undefined) return []

  const chunks = [first]
  let current = ''
  for (const sentence of rest) {
    if (current && current.length + sentence.length + 1 > MAX_CHUNK) {
      chunks.push(current)
      current = ''
    }
    current = current ? `${current} ${sentence}` : sentence
  }
  if (current) chunks.push(current)

  return chunks
}
