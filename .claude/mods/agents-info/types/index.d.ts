export type AgentStatus = 'running' | 'done' | 'failed'

export type AgentRun = {
  id: string
  agentId?: string
  type: string
  description: string
  model: string
  effort?: string
  status: AgentStatus
  startedAt: number
  endedAt?: number
  contextTokens: number
  contextMax: number
  tokens: number
  /** null when the model has no known price. */
  costUsd: number | null
  steps: number
  round: number
}

export type Panel = {
  isCompact: boolean
  isDoneCollapsed: boolean
  hasAutoOpened: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'agents-info': {
      agents: AgentRun[]
      panel: Panel
      now: number
    }
  }
}
