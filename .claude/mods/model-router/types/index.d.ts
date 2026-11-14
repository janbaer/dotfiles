export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max' | number

export type Decision = { choice: string; confidence: number; effort: Effort | null }

export type Route = {
  isDecided: boolean
  pending: Decision | null
  suggestion: string | null
  model: string | null
  effort: Effort | null
  base: string | null
  baseEffort: Effort | null
}

declare module 'claude-code' {
  interface PluginState {
    'model-router': { route: Route }
  }
}
