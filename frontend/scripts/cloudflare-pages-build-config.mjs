const CLOUDFLARE_PAGES_SITE_URL = "https://rewind-site-preview.pages.dev/";

export function createCloudflareCatalogBuildEnvironment(env) {
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!apiBaseUrl || !publishableKey) {
    throw new Error("VITE_API_BASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for the Cloudflare catalog build.");
  }

  return {
    PUBLIC_CATALOG_API_BASE_URL: apiBaseUrl,
    PUBLIC_SITE_URL: CLOUDFLARE_PAGES_SITE_URL,
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
  };
}
