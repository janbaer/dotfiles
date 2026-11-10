export type Decision = { choice: string; confidence: number }

export type Route = {
  isDecided: boolean
  pending: Decision | null
  suggestion: string | null
  model: string | null
  base: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'model-router': { route: Route }
  }
}
