import { expect, test } from 'claude-code/testing'
import { findForeign, type Project } from './match'

const projects: Project[] = [
  { folder: 'dotfiles', description: 'Config', keywords: ['skill', 'mods'] },
  { folder: 'ansible-homelab', description: 'Playbooks', keywords: ['ansible', 'playbook'] },
  { folder: 'n8n', description: 'Workflows', keywords: ['n8n'] },
]

test('asks when only another project matches', () => {
  const hit = findForeign(projects, 'dotfiles', 'Run the ansible playbook for the new host')
  expect(hit?.project.folder).toBe('ansible-homelab')
  expect(hit?.keywords).toEqual(['ansible', 'playbook'])
})

test('passes when the own project matches too', () => {
  expect(findForeign(projects, 'dotfiles', 'Move the skill into the ansible repo')).toBeNull()
})

test('passes when nothing matches', () => {
  expect(findForeign(projects, 'dotfiles', 'fix the typo in line 3')).toBeNull()
})

test('passes when two other projects match', () => {
  expect(findForeign(projects, 'dotfiles', 'Use ansible to roll out the n8n change')).toBeNull()
})

test('passes in a session of an unknown project', () => {
  expect(findForeign(projects, 'Projects', 'ansible playbook')).toBeNull()
})

test('matches whole words only', () => {
  expect(findForeign(projects, 'dotfiles', 'the ansible-like n8nx names')).toBeNull()
})
