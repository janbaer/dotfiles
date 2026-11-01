export type Voice = string
export type Style = 'normal' | 'ruhig' | 'schnell' | 'lustig' | 'variabel'
export type View = { isAuto: boolean; voice: Voice; isPlaying: boolean; isPanelAuto: boolean; style: Style; sampling: Voice | null }

declare module 'claude-code' {
  interface PluginState {
    speak: { view: Shaped<View> }
  }
}
