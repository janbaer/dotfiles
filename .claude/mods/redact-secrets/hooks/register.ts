import type { Register } from 'claude-code'
import { redact, secretsFrom, type Secrets } from './redact'

export const register: Register = on => {
  let secrets: Promise<Secrets> | undefined

  on('session.append', async ($, e, next) => {
    secrets ??= $.process.run(['env', '-0']).then(ran => secretsFrom(ran.stdout))
    const found = await secrets
    if (found.length === 0) return next(e)

    return next({
      ...e,
      message: { ...e.message, content: e.message.content.map(block => redact(found, block)) },
    })
  })
}
