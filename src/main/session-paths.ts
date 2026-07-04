/**
 * Helpers for mapping between real project paths and the directory names Pi
 * uses under `~/.pi/agent/sessions`.
 *
 * Pi encodes a project path into a session directory name by replacing path
 * separators — and, on Windows, the drive-letter colon — with `-`, then
 * wrapping the result in `--`:
 *
 *   POSIX    /home/alice                    -> --home-alice--
 *   Windows  C:\Users\UPN\documents\workday -> --C--Users-UPN-documents-workday--
 *
 * Decoding is inherently lossy (real `-` characters are indistinguishable from
 * separators), so callers should prefer matching against known workspace paths
 * and fall back to `desanitizeSessionDir` only for display.
 */

/** Encode a real filesystem path the same way Pi names its session directory. */
export function sanitizePath(p: string): string {
  // Drop a single leading separator so POSIX "/home/x" -> "--home-x--".
  // Windows paths start with a drive letter, so nothing is stripped there.
  const body = p.replace(/^[\\/]/, '').replace(/[\\/:]/g, '-')
  return `--${body}--`
}

/**
 * The Pi session directory name for `dir`, relative to `sessionsRoot`.
 * Strips the root prefix and any leading separator of either kind, and
 * normalizes backslashes so the result compares equal across platforms.
 */
export function sessionDirName(dir: string, sessionsRoot: string): string {
  const rel = dir.startsWith(sessionsRoot) ? dir.slice(sessionsRoot.length) : dir
  return rel.replace(/^[\\/]+/, '').replace(/\\/g, '/')
}

/**
 * Best-effort (lossy) reversal of `sanitizePath`, for display only.
 * Returns the directory name unchanged if it isn't a Pi-sanitized name.
 */
export function desanitizeSessionDir(dirName: string): string {
  if (!dirName.startsWith('--') || !dirName.endsWith('--')) {
    return dirName
  }
  const inner = dirName.slice(2, -2)
  // filter(Boolean) collapses the empty segment left by the Windows "C:\" -> "C--".
  const segments = inner.split('-').filter(Boolean)
  return '/' + segments.join('/')
}

/** Separator-agnostic basename; handles both `/` and `\` and trailing separators. */
export function projectNameFromPath(p: string): string {
  const parts = p.split(/[\\/]/).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : p
}
