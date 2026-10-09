import { expect, test } from 'claude-code/testing'

const LIST = [
  '2026-10-02-nutzungslog-fuer-skills\t2026-10-02\tNutzungslog für Skills',
  '2026-10-02-skills-pruefen\t2026-10-02\tSkills prüfen',
].join('\n')

test('pane lists ideas and a press starts the grill', async ($, on) => {
  const submitted: string[] = []
  on('process.run', async () => ({ value: { exitCode: 0, stdout: LIST, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('prompt.submit', async (_$, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })

  await $.command.run({ command: 'idea', args: '' })
  const ui = await $.ui.mount({ plugin: 'ideas-pane', surface: 'terminal', component: 'Pane', requestId: 'ideas', props: {}, viewport: { columns: 60, rows: 30 } })
  expect(await ui.find({ key: '2026-10-02-skills-pruefen' })).toBeDefined()

  await ui.press({ key: '2026-10-02-skills-pruefen' })
  expect(submitted).toEqual(['Use the jb-ideas skill, mode grill, on the idea 2026-10-02-skills-pruefen.'])
  await ui.unmount()
})
