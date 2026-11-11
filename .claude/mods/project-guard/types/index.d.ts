export type Guard = { silenced: string[] }

declare module 'claude-code' {
  interface PluginState {
    'project-guard': { guard: Guard }
  }
}
