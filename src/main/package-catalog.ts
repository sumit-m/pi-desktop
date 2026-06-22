import type { CatalogPackage } from '../shared/ipc-contracts'

// The package catalog at pi.dev/packages is a server-rendered, paginated list
// with no search endpoint (query params are ignored, /api/* returns 501). To
// make the whole catalog searchable we scrape every page once, cache it, and
// filter locally.

const CATALOG_BASE_URL = 'https://pi.dev/packages'
// The server renders up to this many package cards per page; a short page marks
// the end of the catalog.
const PAGE_SIZE = 50
// Safety cap so a server change (e.g. always-full pages) cannot loop forever.
const MAX_PAGES = 40
// Re-scrape at most this often; search fires on every keystroke, so without a
// cache each keystroke would re-crawl every page.
const CACHE_TTL_MS = 5 * 60 * 1000

interface CatalogCache {
  packages: CatalogPackage[]
  fetchedAt: number
}

let catalogCache: CatalogCache | null = null

// Parse the package cards out of a single rendered catalog page. Pure so it can
// be tested against captured HTML without network access.
export function parseCatalogHtml(html: string): CatalogPackage[] {
  const packages: CatalogPackage[] = []
  const articleRegex = /<article[^>]*data-package-card="true"[^>]*>[\s\S]*?<\/article>/g
  let articleMatch: RegExpExecArray | null

  while ((articleMatch = articleRegex.exec(html)) !== null) {
    const article = articleMatch[0]

    const nameMatch = article.match(/data-package-name="([^"]+)"/)
    if (!nameMatch) continue
    const name = nameMatch[1]

    const downloadsRawMatch = article.match(/data-package-downloads="([^"]+)"/)
    const dateMatch = article.match(/data-package-date="([^"]+)"/)

    const descMatch = article.match(/<p class="packages-desc">([^<]+)<\/p>/)
    const description = descMatch ? descMatch[1].trim() : ''

    // packages-meta holds 3 spans: author, downloads/mo display, time-ago
    const metaMatch = article.match(/<div class="packages-meta">([\s\S]*?)<\/div>/)
    const metaSpans = metaMatch
      ? [...metaMatch[1].matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1])
      : []
    const author = metaSpans[0] ?? ''
    const downloadsDisplay = metaSpans[1] ?? ''

    const typeMatch = article.match(/data-type="([^"]+)"/)
    const type = typeMatch ? typeMatch[1] : 'package'

    const npmMatch = article.match(/href="(https:\/\/www\.npmjs\.com\/package\/[^"]+)"/)
    const npmUrl = npmMatch ? npmMatch[1] : null

    // Repo link is a github.com URL that is not a /issues/ link
    const githubMatches = [...article.matchAll(/href="(https:\/\/github\.com\/[^"]+)"/g)]
    const repoUrl = githubMatches.map((m) => m[1]).find((u) => !u.includes('/issues/')) ?? null

    const downloads = downloadsRawMatch ? parseInt(downloadsRawMatch[1], 10) : 0
    const updatedAt = dateMatch ? new Date(parseInt(dateMatch[1], 10)).toISOString() : ''

    packages.push({
      name,
      description,
      author,
      type,
      downloads,
      downloadsDisplay,
      updatedAt,
      npmUrl,
      repoUrl,
      installCommand: `npm:${name}`,
    })
  }

  return packages
}

// Match every whitespace-separated token against the combined name, description
// and author. Tokenizing lets multi-word queries like "ollama cloud" match a
// package named "pi-ollama-cloud". Pure for testability.
export function filterCatalog(
  packages: CatalogPackage[],
  query: string | undefined
): CatalogPackage[] {
  if (!query || !query.trim()) return packages
  const tokens = query.trim().toLowerCase().split(/\s+/)
  return packages.filter((pkg) => {
    const haystack = `${pkg.name} ${pkg.description} ${pkg.author}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

async function fetchCatalogPage(page: number): Promise<CatalogPackage[]> {
  const response = await fetch(`${CATALOG_BASE_URL}?page=${page}`)
  if (!response.ok) return []
  return parseCatalogHtml(await response.text())
}

// Crawl every catalog page (stopping at the first short page) and cache the
// result. Exposed so the cache can be primed/forced if ever needed.
export async function fetchAllCatalogPackages(
  options?: { force?: boolean }
): Promise<CatalogPackage[]> {
  if (
    !options?.force &&
    catalogCache &&
    Date.now() - catalogCache.fetchedAt < CACHE_TTL_MS
  ) {
    return catalogCache.packages
  }

  const packages: CatalogPackage[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const pagePackages = await fetchCatalogPage(page)
    packages.push(...pagePackages)
    if (pagePackages.length < PAGE_SIZE) break
  }

  catalogCache = { packages, fetchedAt: Date.now() }
  return packages
}

// Reset the in-memory cache (test seam).
export function clearCatalogCache(): void {
  catalogCache = null
}

// Fetch the full catalog (cached) and apply the search filter locally.
export async function fetchPackageCatalog(query?: string): Promise<CatalogPackage[]> {
  try {
    const packages = await fetchAllCatalogPackages()
    return filterCatalog(packages, query)
  } catch {
    return []
  }
}
