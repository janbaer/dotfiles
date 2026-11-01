export type Voice = string
export type Style = 'normal' | 'ruhig' | 'schnell' | 'lustig' | 'variabel'
export type Language = 'auto' | 'de' | 'en'
export type View = { isAuto: boolean; voice: Voice; isPlaying: boolean; isPanelAuto: boolean; style: Style; language: Language; sampling: Voice | null }

declare module 'claude-code' {
  interface PluginState {
    speak: { view: Shaped<View> }
  }
}
