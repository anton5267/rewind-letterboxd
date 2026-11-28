import assert from "node:assert/strict";
import test from "node:test";

import { createCloudflareCatalogBuildEnvironment } from "./cloudflare-pages-build-config.mjs";

test("Cloudflare catalog metadata uses the stable project URL, not a deployment URL", () => {
  const env = createCloudflareCatalogBuildEnvironment({
    CF_PAGES_URL: "https://822a3d74.rewind-site-preview.pages.dev",
    VITE_API_BASE_URL: "https://cuirmicbzspomijgkkwo.supabase.co/functions/v1/rewind-api/api",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  });

  assert.equal(env.PUBLIC_SITE_URL, "https://rewind-site-preview.pages.dev/");
  assert.equal(env.PUBLIC_CATALOG_API_BASE_URL, "https://cuirmicbzspomijgkkwo.supabase.co/functions/v1/rewind-api/api");
  assert.equal(env.SUPABASE_PUBLISHABLE_KEY, "sb_publishable_test");
});

test("Cloudflare catalog build rejects missing public API configuration", () => {
  assert.throws(
    () => createCloudflareCatalogBuildEnvironment({}),
    /VITE_API_BASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required/,
  );
});
