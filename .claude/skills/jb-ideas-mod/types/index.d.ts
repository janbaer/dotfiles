export type Idea = { name: string; date: string; title: string }

declare module 'claude-code' {
  interface PluginState {
    'ideas-pane': { ideas: Idea[]; error: string | null }
  }
}
