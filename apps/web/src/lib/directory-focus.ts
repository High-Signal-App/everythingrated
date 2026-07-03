/**
 * Product focus (2026-07-03): EverythingRated is narrowed to one use case —
 * helping operators decide which AI dev tools to adopt.
 *
 * Every seeded directory other than `ai-dev-tools` (databases, hosting, and
 * the rest of the seeded catalogue) is PARKED, not deleted: `/d/[directory]`
 * routes, feeds, and existing ratings keep working for direct links, but
 * parked directories are hidden from the homepage, header nav, sitemap, and
 * cross-directory suggestion chips. No data was removed.
 */
export const FOCUS_DIRECTORY_SLUG = "ai-dev-tools";

export function isParkedDirectory(slug: string): boolean {
  return slug !== FOCUS_DIRECTORY_SLUG;
}
