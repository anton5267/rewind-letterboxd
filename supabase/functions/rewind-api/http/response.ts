import type { HostedAuthUser, RewindAuthVerifier } from "../contracts/auth.ts";
import { RewindApiError } from "./errors.ts";

export const FUNCTION_PREFIX = "/functions/v1/rewind-api";

export const PUBLIC_CATALOG_CACHE = "public, max-age=300, stale-while-revalidate=600";

export function json(body: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  if (!responseHeaders.has("Cache-Control")) responseHeaders.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

export function apiPath(pathname: string): string {
  if (pathname === FUNCTION_PREFIX || pathname === `${FUNCTION_PREFIX}/`) return "/";
  const apiIndex = pathname.indexOf("/api/");
  if (apiIndex >= 0) return pathname.slice(apiIndex);
  return pathname.startsWith(`${FUNCTION_PREFIX}/`)
    ? pathname.slice(FUNCTION_PREFIX.length)
    : pathname;
}

export async function confirmedAuthUser(request: Request, verifier?: RewindAuthVerifier): Promise<HostedAuthUser | null> {
  const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer || !verifier) return null;
  try {
    const user = await verifier.verifyAccessToken(bearer);
    return user?.emailConfirmed ? user : null;
  } catch {
    return null;
  }
}

export function repositoryFailure(error: unknown, fallback: string, headers: HeadersInit): Response {
  if (error instanceof RewindApiError && error.status >= 400 && error.status < 500) {
    return json({ message: error.message }, error.status, headers);
  }
  if (error instanceof RewindApiError && (error.status === 502 || error.status === 503)) {
    return json({ message: error.message }, error.status, headers);
  }
  return json({ message: fallback }, 500, headers);
}
