import { resolveAllowedOrigins } from "./allowed_origins.ts";

Deno.test("configured origins retain existing hosts and add only the exact approved Cloudflare Pages hosts", () => {
  const origins = resolveAllowedOrigins(
    "https://anton5267.github.io, https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev",
  );

  if (!origins.includes("https://anton5267.github.io")) {
    throw new Error("GitHub Pages must remain allowed");
  }
  if (
    !origins.includes(
      "https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev",
    )
  ) {
    throw new Error("The configured preview origin must remain allowed");
  }
  if (!origins.includes("https://rewind-site-preview.pages.dev")) {
    throw new Error("The Cloudflare Pages production origin must be allowed");
  }
  if (!origins.includes("https://codex-motion-system.rewind-site-preview.pages.dev")) {
    throw new Error("The exact Cloudflare Pages branch preview must be allowed");
  }
  if (origins.includes("https://another-branch.rewind-site-preview.pages.dev")) {
    throw new Error("Unapproved Cloudflare Pages branch previews must remain blocked");
  }
  if (
    origins.some((origin) =>
      origin === "https://*.pages.dev" || origin.includes("*")
    )
  ) {
    throw new Error("Cloudflare Pages origins must not use a wildcard");
  }
});

Deno.test("default origin configuration keeps local development and GitHub Pages working", () => {
  const origins = resolveAllowedOrigins(undefined);

  for (
    const expected of [
      "https://anton5267.github.io",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "https://rewind-site-preview.pages.dev",
      "https://codex-motion-system.rewind-site-preview.pages.dev",
    ]
  ) {
    if (!origins.includes(expected)) {
      throw new Error(`Missing default origin: ${expected}`);
    }
  }
});
