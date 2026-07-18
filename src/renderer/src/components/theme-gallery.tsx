import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import type { GalleryTheme, UserThemeRecord } from '../../../shared/ipc-contracts'

interface ThemeGalleryProps {
  onClose: () => void
  // Called after a gallery theme is installed so the panel can register,
  // apply, and select it (installs go through the same validated,
  // SSRF-guarded path as manual URL installs).
  onInstalled: (theme: UserThemeRecord) => void
}

type LoadState = 'loading' | 'ready' | 'error'

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
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border-strong bg-surface shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold text-primary">Community themes</h3>
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
            <ul className="flex flex-col gap-2">
              {themes.map((theme) => {
                const installed = installedUrls.has(theme.url)
                const installing = installingUrl === theme.url
                return (
                  <li
                    key={theme.url}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-primary">{theme.name}</div>
                      <div className="text-xs capitalize text-dim">{theme.kind}</div>
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
