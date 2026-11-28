const defaultAllowedOrigins = [
  "https://anton5267.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

const cloudflarePagesProductionOrigin = "https://rewind-site-preview.pages.dev";
const cloudflarePagesBranchPreviewOrigin =
  "https://codex-motion-system.rewind-site-preview.pages.dev";

export function resolveAllowedOrigins(
  configuredOrigins: string | undefined,
): string[] {
  const origins =
    (configuredOrigins === undefined
      ? defaultAllowedOrigins
      : configuredOrigins.split(","))
      .map((origin) => origin.trim())
      .filter(Boolean);

  return [...new Set([
    ...origins,
    cloudflarePagesProductionOrigin,
    cloudflarePagesBranchPreviewOrigin,
  ])];
}
