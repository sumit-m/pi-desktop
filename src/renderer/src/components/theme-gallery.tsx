import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { X, Check, User } from 'lucide-react'
import type { GalleryTheme, UserThemeRecord } from '../../../shared/ipc-contracts'
import { resolveThemeVars } from '../../../shared/theme/resolve'

interface ThemeGalleryProps {
  onClose: () => void
  // Called after a gallery theme is installed so the panel can register,
  // apply, and select it (installs go through the same validated,
  // SSRF-guarded path as manual URL installs).
  onInstalled: (theme: UserThemeRecord) => void
}

type LoadState = 'loading' | 'ready' | 'error'

// Scopes a theme's full resolved variable set to one preview card. The card's
// children read var(--color-*) exactly like the real app does, so the preview
// uses the same derivation pipeline (color-mix and all) as an actual install
// — no screenshots or approximations involved.
function previewStyle(theme: NonNullable<GalleryTheme['theme']>): CSSProperties {
  return resolveThemeVars(theme) as CSSProperties
}

// A miniature of the app's layout: sidebar, chat surface with two bubbles,
// an accent action, and status dots — enough to judge a theme at a glance.
function ThemePreview({ theme }: { theme: NonNullable<GalleryTheme['theme']> }): React.JSX.Element {
  return (
    <div
      style={{ ...previewStyle(theme), borderColor: 'var(--color-border)' }}
      className="pointer-events-none flex h-28 select-none overflow-hidden rounded-md border"
      aria-hidden
    >
      <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="flex w-1/4 flex-col gap-1.5 border-r p-2">
        <div style={{ backgroundColor: 'var(--color-accent)' }} className="h-2 w-3/4 rounded-sm" />
        <div style={{ backgroundColor: 'var(--color-muted)' }} className="h-1.5 w-full rounded-sm opacity-60" />
        <div style={{ backgroundColor: 'var(--color-muted)' }} className="h-1.5 w-5/6 rounded-sm opacity-40" />
        <div style={{ backgroundColor: 'var(--color-muted)' }} className="h-1.5 w-4/6 rounded-sm opacity-40" />
      </div>
      <div style={{ backgroundColor: 'var(--color-app)' }} className="flex flex-1 flex-col justify-between p-2">
        <div className="flex flex-col gap-1.5">
          <div style={{ backgroundColor: 'var(--color-card)' }} className="h-4 w-3/4 self-start rounded-sm" />
          <div style={{ backgroundColor: 'var(--color-accent)' }} className="h-4 w-2/3 self-end rounded-sm opacity-90" />
          <div style={{ backgroundColor: 'var(--color-card)' }} className="h-4 w-1/2 self-start rounded-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ backgroundColor: 'var(--color-success)' }} className="h-2 w-2 rounded-full" />
          <span style={{ backgroundColor: 'var(--color-warning)' }} className="h-2 w-2 rounded-full" />
          <span style={{ backgroundColor: 'var(--color-error)' }} className="h-2 w-2 rounded-full" />
          <span
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}
            className="ml-auto rounded-sm px-1.5 py-0.5 text-[8px] leading-tight"
          >
            Aa
          </span>
        </div>
      </div>
    </div>
  )
}

export function ThemeGallery({ onClose, onInstalled }: ThemeGalleryProps): React.JSX.Element {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [themes, setThemes] = useState<GalleryTheme[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [installingUrl, setInstallingUrl] = useState<string | null>(null)
  const [installedUrls, setInstalledUrls] = useState<Set<string>>(new Set())
  const [installError, setInstallError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.piDesktop.themes.gallery().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setThemes(result.themes)
        setLoadState('ready')
      } else {
        setLoadError(result.error)
        setLoadState('error')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const install = async (theme: GalleryTheme): Promise<void> => {
    setInstallingUrl(theme.url)
    setInstallError(null)
    const result = await window.piDesktop.themes.installFromUrl(theme.url)
    setInstallingUrl(null)
    if (result.ok) {
      setInstalledUrls((prev) => new Set(prev).add(theme.url))
      onInstalled(result.theme)
    } else if (!('canceled' in result)) {
      setInstallError(result.error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-border-strong bg-surface shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-primary">Community themes</h3>
            <p className="text-xs text-dim">
              From the pi-desktop-themes gallery — previews render each theme&apos;s real colors
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-dim hover:bg-surface-hover hover:text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loadState === 'loading' && <p className="text-sm text-muted">Loading themes…</p>}
          {loadState === 'error' && (
            <p className="text-sm text-error">Could not load the gallery: {loadError}</p>
          )}
          {loadState === 'ready' && themes.length === 0 && (
            <p className="text-sm text-muted">No themes are available yet.</p>
          )}
          {loadState === 'ready' && themes.length > 0 && (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {themes.map((theme) => {
                const installed = installedUrls.has(theme.url)
                const installing = installingUrl === theme.url
                return (
                  <li
                    key={theme.url}
                    className="flex flex-col gap-2 rounded-md border border-border bg-app/40 p-3"
                  >
                    {theme.theme && <ThemePreview theme={theme.theme} />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-primary">{theme.name}</span>
                          <span className="shrink-0 rounded-sm bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                            {theme.kind}
                          </span>
                        </div>
                        {theme.author && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-dim">
                            <User size={10} />
                            <span className="truncate">{theme.author}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => void install(theme)}
                        disabled={installing || installed}
                        className="shrink-0 rounded-md border border-border-strong px-3 py-1 text-sm text-muted hover:bg-surface-hover transition-colors disabled:opacity-60"
                      >
                        {installed ? (
                          <span className="flex items-center gap-1">
                            <Check size={14} /> Installed
                          </span>
                        ) : installing ? (
                          'Installing…'
                        ) : (
                          'Install'
                        )}
                      </button>
                    </div>
                    {theme.description && (
                      <p className="text-xs leading-relaxed text-muted">{theme.description}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {installError && <p className="mt-3 text-xs text-error">{installError}</p>}
        </div>
      </div>
    </div>
  )
}
