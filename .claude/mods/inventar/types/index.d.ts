export type Running = {
  id: string
  label: string
  since: number
  agent?: string
  canHang: boolean
}

export type Phase = { kind: 'idle' | 'thinking'; since: number }

export type Goal = { text: string; source: 'haiku' | 'prompt' | 'goal' }

export type TodoStatus = 'pending' | 'in_progress' | 'completed'

export type Todo = { id?: string; content: string; activeForm?: string; status: TodoStatus }

export type FileUse = { path: string; reads: number; changes: number }

declare module 'claude-code' {
  interface PluginState {
    inventar: {
      running: Running[]
      phase: Phase
      goal: Goal | null
      goalAsked: boolean
      todos: Todo[]
      connectors: Record<string, number>
      skills: Record<string, number>
      files: FileUse[]
      agents: Record<string, string>
      isCompact: boolean
      now: number
    }
  }
}
