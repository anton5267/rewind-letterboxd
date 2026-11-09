import { RewindApiError, type HostedAuthUser } from "./handler.ts";

export function readPublishableKey(env: (name: string) => string | undefined): string | undefined {
  const legacy = env("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try {
    const keys = env("SUPABASE_PUBLISHABLE_KEYS");
    if (!keys) return undefined;
    const parsed = JSON.parse(keys) as Record<string, unknown>;
    return typeof parsed.default === "string" ? parsed.default : undefined;
  } catch {
    return undefined;
  }
}

export function readSecretKey(env: (name: string) => string | undefined): string | undefined {
  try {
    const keys = env("SUPABASE_SECRET_KEYS");
    if (keys) {
      const parsed = JSON.parse(keys) as Record<string, unknown>;
      if (typeof parsed.default === "string" && parsed.default) return parsed.default;
    }
  } catch { /* use legacy server-only service role key if configured */ }
  return env("SUPABASE_SERVICE_ROLE_KEY");
}

async function verifyCurrentPassword(
  supabaseUrl: string,
  publishableKey: string,
  authUser: HostedAuthUser,
  currentPassword: string,
  fetcher: typeof fetch,
): Promise<string> {
  const verification = await fetcher(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: authUser.email, password: currentPassword }),
  });
  if (!verification.ok) {
    if (verification.status === 429) throw new RewindApiError(429, "Too many authentication attempts");
    if (verification.status >= 500) throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    throw new RewindApiError(400, "Current password is incorrect");
  }
  const credentials = await verification.json();
  if (credentials?.user?.id !== authUser.id || typeof credentials?.access_token !== "string") {
    throw new RewindApiError(400, "Current password is incorrect");
  }
  return credentials.access_token;
}

export function createHostedPasswordVerifier(
  supabaseUrl: string | undefined,
  publishableKey: string | undefined,
  fetcher: typeof fetch = fetch,
) {
  return async (authUser: HostedAuthUser, currentPassword: string): Promise<void> => {
    if (!supabaseUrl || !publishableKey) throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    try { await verifyCurrentPassword(supabaseUrl, publishableKey, authUser, currentPassword, fetcher); }
    catch (error) {
      if (error instanceof RewindApiError) throw error;
      throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    }
  };
}

export function createHostedPasswordChanger(
  supabaseUrl: string | undefined,
  publishableKey: string | undefined,
  fetcher: typeof fetch = fetch,
) {
  return async (authUser: HostedAuthUser, currentPassword: string, newPassword: string): Promise<void> => {
    if (!supabaseUrl || !publishableKey) {
      throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    }
    try {
      const accessToken = await verifyCurrentPassword(supabaseUrl, publishableKey, authUser, currentPassword, fetcher);
      const update = await fetcher(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!update.ok) {
        if (update.status === 429) throw new RewindApiError(429, "Too many authentication attempts");
        if (update.status >= 500) throw new RewindApiError(503, "Authentication service is temporarily unavailable");
        throw new RewindApiError(400, "Unable to update password");
      }
    } catch (error) {
      if (error instanceof RewindApiError) throw error;
      throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    }
  };
}

export function createHostedIdentityDeleter(
  supabaseUrl: string | undefined,
  secretKey: string | undefined,
  fetcher: typeof fetch = fetch,
) {
  return async (supabaseUserId: string): Promise<void> => {
    if (!supabaseUrl || !secretKey) throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supabaseUserId)) {
      throw new RewindApiError(400, "Invalid Supabase identity");
    }
    try {
      const response = await fetcher(`${supabaseUrl}/auth/v1/admin/users/${supabaseUserId}`, {
        method: "DELETE",
        headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
      });
      if (response.ok || response.status === 404) return;
      if (response.status === 429) throw new RewindApiError(429, "Too many authentication attempts");
      throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    } catch (error) {
      if (error instanceof RewindApiError) throw error;
      throw new RewindApiError(503, "Authentication service is temporarily unavailable");
    }
  };
}
