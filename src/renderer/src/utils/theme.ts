import type { ThemeFile } from '../../../shared/theme/theme-file'
import { resolveThemeVars } from '../../../shared/theme/resolve'
import { BUILTIN_THEMES } from '../themes'
import { applyThemeVars } from '../theme/engine'

export interface RegisteredTheme { id: string; file: ThemeFile }

const registry = new Map<string, ThemeFile>(BUILTIN_THEMES.map((t) => [t.id, t.file]))
let appliedVarKeys: string[] = []

export function registerThemes(themes: ReadonlyArray<RegisteredTheme>): void {
  for (const theme of themes) registry.set(theme.id, theme.file)
}

export function getRegisteredThemes(): ReadonlyArray<RegisteredTheme> {
  return [...registry.entries()].map(([id, file]) => ({ id, file }))
}

function systemThemeId(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(themeId: string): void {
  const id = themeId === 'system' ? systemThemeId() : themeId
  const file = registry.get(id) ?? registry.get('dark')!
  const html = document.documentElement
  appliedVarKeys = applyThemeVars(html, resolveThemeVars(file), appliedVarKeys)
  html.classList.toggle('light', file.kind === 'light')
  html.style.colorScheme = file.kind
}

export function isLightTheme(themeId: string | null | undefined): boolean {
  if (!themeId) return false
  const id = themeId === 'system' ? systemThemeId() : themeId
  return registry.get(id)?.kind === 'light'
}
