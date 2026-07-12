// Pure decision logic for "minimize to system tray on close". Kept free of any
// `electron` import so it can be unit-tested under a plain Node runtime. The
// electron-facing Tray lifecycle lives in tray-manager.ts.

/** Platforms where the app supports a system-tray / minimize-to-tray idiom. */
export function trayIsSupported(platform: NodeJS.Platform): boolean {
  // macOS is intentionally excluded: closing the window there already keeps the
  // app alive in the Dock, which is the native equivalent. Adding a menu-bar
  // item would be a different convention (see the feature design decision).
  return platform === 'win32' || platform === 'linux'
}

/**
 * Whether a window `close` should be intercepted and turned into "hide to tray"
 * instead of a real close.
 *
 * `trayAvailable` is the critical guard for cross-platform robustness: on a
 * system with no working system tray (e.g. GNOME without the AppIndicator
 * extension, a minimal WM, or no session bus), hiding the window would strand
 * it behind a non-existent icon. When the tray isn't available we fall through
 * to a normal close so the app quits as expected instead of vanishing.
 *
 * @param isQuitting     true once a real quit is underway (set in `before-quit`),
 *                       so tray Quit / Cmd-Ctrl+Q / menu Quit still exit.
 * @param enabled        the user's `minimizeToTrayOnClose` setting.
 * @param platform       `process.platform`.
 * @param trayAvailable  whether a usable tray icon actually exists this session.
 */
export function shouldHideToTray(params: {
  isQuitting: boolean
  enabled: boolean
  platform: NodeJS.Platform
  trayAvailable: boolean
}): boolean {
  const { isQuitting, enabled, platform, trayAvailable } = params
  return !isQuitting && enabled && trayIsSupported(platform) && trayAvailable
}
