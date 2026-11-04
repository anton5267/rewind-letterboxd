export type PublicCatalogLanguage = "uk" | "en";

interface PublicCatalogMetadata {
  language: PublicCatalogLanguage;
  title: string;
  description: string;
  imageUrl?: string | null;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string | null | undefined) {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    existing?.remove();
    return;
  }
  const meta = existing ?? document.head.appendChild(document.createElement("meta"));
  meta.setAttribute(attribute, key);
  meta.content = content;
}

export function setPublicCatalogMetadata({ language, title, description, imageUrl }: PublicCatalogMetadata) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  document.documentElement.lang = language;
  document.title = `${title} | REWIND`;

  const canonicalUrl = new URL(window.location.pathname, window.location.origin);
  if (!canonicalUrl.pathname.endsWith("/")) canonicalUrl.pathname += "/";
  const safeImageUrl = (() => {
    if (!imageUrl) return null;
    try {
      const parsed = new URL(imageUrl);
      return parsed.protocol === "https:" ? parsed.href : null;
    } catch {
      return null;
    }
  })();

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?? document.head.appendChild(document.createElement("link"));
  canonical.rel = "canonical";
  canonical.href = canonicalUrl.href;

  upsertMeta("name", "description", description);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:title", `${title} | REWIND`);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonicalUrl.href);
  upsertMeta("property", "og:locale", language === "uk" ? "uk_UA" : "en_US");
  upsertMeta("property", "og:image", safeImageUrl);
  upsertMeta("name", "twitter:card", safeImageUrl ? "summary_large_image" : "summary");
}
