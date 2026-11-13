import type { HttpRouteContext } from "../context.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

export async function handleProfileEmailRoute(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, repository, authVerifier, corsHeaders } = context;
  if (path !== "/api/profile/me/email") return null;
  if (request.method !== "POST") {
    corsHeaders.set("Allow", "POST, OPTIONS");
    return json({ message: "Method not allowed" }, 405, corsHeaders);
  }
  try {
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser || !bearer) return json({ message: "Authentication required" }, 401, corsHeaders);
    if (!authVerifier?.requestEmailChange || !repository.getOrCreateCurrentUser) {
      return json({ message: "Not found" }, 404, corsHeaders);
    }
    let value: unknown;
    try { value = await request.json(); }
    catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return json({ message: "Invalid email change request" }, 400, corsHeaders);
    }
    const body = value as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const language = body.language;
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || (language !== "uk" && language !== "en")
      || typeof body.expectedUserId !== "number" || !Number.isSafeInteger(body.expectedUserId) || body.expectedUserId <= 0) {
      return json({ message: "Invalid email change request" }, 400, corsHeaders);
    }
    const user = await repository.getOrCreateCurrentUser(authUser);
    if (user.id !== body.expectedUserId) {
      return json({ message: "The signed-in account has changed" }, 409, corsHeaders);
    }
    if (email.toLowerCase() === authUser.email.toLowerCase()) {
      return json({ message: "This email address is already current" }, 400, corsHeaders);
    }
    await authVerifier.requestEmailChange(bearer, email, language);
    return json({ confirmationRequired: true }, 202, corsHeaders);
  } catch (error) {
    return repositoryFailure(error, "Unable to request email change", corsHeaders);
  }
}
