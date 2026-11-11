export type Project = { folder: string; description: string; keywords: string[] }
type Hit = { project: Project; keywords: string[] }

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matched = (project: Project, text: string) =>
  project.keywords.filter(word => new RegExp(`(?<![\\w-])${escape(word)}(?![\\w-])`, 'i').test(text))

export function findForeign(projects: readonly Project[], current: string, text: string): Hit | null {
  const own = projects.find(project => project.folder === current)
  if (!own || matched(own, text).length > 0) return null
  const hits = projects
    .filter(project => project !== own)
    .map(project => ({ project, keywords: matched(project, text) }))
    .filter(hit => hit.keywords.length > 0)
  return hits.length === 1 ? (hits[0] ?? null) : null
}
