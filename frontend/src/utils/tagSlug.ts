/**
 * Mirrors the backend TagService normalization used by the public-list filter.
 * API responses expose tag names in cards/details, while the filter endpoint
 * intentionally accepts the persisted slug.
 */
export function toTagSlug(value: string): string {
  return value
    .trim()
    .replace(/\s+/gu, " ")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}
