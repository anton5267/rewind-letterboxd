import type { HttpRouteContext } from "../context.ts";
import { parseAdminPage, parseRouteId } from "../parsers/query.ts";
import { parseAdminUserUpdate } from "../parsers/admin.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const ADMIN_USERS_PATH = "/api/admin/users";
const ADMIN_USER_PATTERN = /^\/api\/admin\/users\/(\d+)(?:\/(overview|activate|deactivate|hq))?$/;
const ADMIN_DASHBOARD_PATH = "/api/admin/dashboard";
const ADMIN_AUDIT_LOGS_PATH = "/api/admin/audit-logs";
const ADMIN_SETTINGS_PATH = "/api/admin/settings";
const ADMIN_SETTING_PATTERN = /^\/api\/admin\/settings\/([^/]+)$/;

export async function handleAdminAccountRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const adminSettingMatch = path.match(ADMIN_SETTING_PATTERN);

  if (path === ADMIN_DASHBOARD_PATH || path === ADMIN_AUDIT_LOGS_PATH || path === ADMIN_SETTINGS_PATH || adminSettingMatch) {
    const allowed = path === ADMIN_DASHBOARD_PATH ? ["GET"]
      : path === ADMIN_AUDIT_LOGS_PATH ? ["GET"]
      : path === ADMIN_SETTINGS_PATH ? ["GET"] : ["PUT"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (path === ADMIN_DASHBOARD_PATH) {
        if (!repository.getAdminDashboard) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminDashboard(authUser), 200, corsHeaders);
      }
      if (path === ADMIN_AUDIT_LOGS_PATH) {
        const page = parseAdminPage(query, 100, 50);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        if (!repository.getAdminAuditLogs) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminAuditLogs(authUser, page.page, page.size), 200, corsHeaders);
      }
      if (path === ADMIN_SETTINGS_PATH) {
        if (!repository.getAdminSettings) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminSettings(authUser), 200, corsHeaders);
      }
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const value = body && typeof body === "object" && !Array.isArray(body) ? (body as { value?: unknown }).value : undefined;
      if (typeof value !== "string" || value.trim().length < 1 || value.length > 255) return json({ message: "Invalid setting value" }, 400, corsHeaders);
      let key: string;
      try { key = decodeURIComponent(adminSettingMatch![1]); } catch { return json({ message: "Invalid setting key" }, 400, corsHeaders); }
      const allowedKeys = new Set(["site_name", "default_locale", "maintenance_mode", "journal_enabled"]);
      const normalized = value.trim();
      if (!allowedKeys.has(key)
        || ((key === "maintenance_mode" || key === "journal_enabled") && !/^(true|false)$/i.test(normalized))
        || (key === "default_locale" && !/^(uk|en)$/i.test(normalized))) return json({ message: "Invalid setting" }, 400, corsHeaders);
      if (!repository.updateAdminSetting) return json({ message: "Not found" }, 404, corsHeaders);
      const result = await repository.updateAdminSetting(authUser, key, normalized);
      return result ? json(result, 200, corsHeaders) : json({ message: "Site setting not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to manage site settings", corsHeaders);
    }
  }

  const adminUserMatch = path.match(ADMIN_USER_PATTERN);

  if (path === ADMIN_USERS_PATH || adminUserMatch) {
    const idText = adminUserMatch?.[1] ?? null;
    const action = adminUserMatch?.[2] ?? null;
    const allowed = idText === null ? ["GET"] : action === "activate" || action === "deactivate" ? ["POST"]
      : action === "hq" ? ["PUT"] : action === "overview" ? ["GET"] : ["GET", "PATCH"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const id = idText === null ? null : parseRouteId(idText);
    if (idText !== null && id === null) return json({ message: "Invalid user ID" }, 400, corsHeaders);
    try {
      if (id === null) {
        const page = parseAdminPage(query, 50, 20);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        const search = query.get("q")?.trim() || null;
        if (search !== null && search.length > 1000) return json({ message: "Search query is too long" }, 400, corsHeaders);
        if (!repository.getAdminUsers) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminUsers(authUser, search, page.page, page.size), 200, corsHeaders);
      }
      if (action === "overview") {
        if (!repository.getAdminUserOverview) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.getAdminUserOverview(authUser, id);
        return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
      }
      if (action === "activate" || action === "deactivate") {
        if (!repository.setAdminUserActive) return json({ message: "Not found" }, 404, corsHeaders);
        if (!await repository.setAdminUserActive(authUser, id, action === "activate")) return json({ message: "User not found" }, 404, corsHeaders);
        return new Response(null, { status: 200, headers: corsHeaders });
      }
      if (action === "hq") {
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { hq?: unknown }).hq !== "boolean") {
          return json({ message: "Invalid HQ request" }, 400, corsHeaders);
        }
        if (!repository.setAdminUserHq) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.setAdminUserHq(authUser, id, (body as { hq: boolean }).hq);
        return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
      }
      if (request.method === "PATCH") {
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const update = parseAdminUserUpdate(body);
        if (!update) return json({ message: "Invalid user update" }, 400, corsHeaders);
        if (!repository.updateAdminUser) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.updateAdminUser(authUser, id, update);
        return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
      }
      if (!repository.getAdminUser) return json({ message: "Not found" }, 404, corsHeaders);
      const result = await repository.getAdminUser(authUser, id);
      return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to manage user", corsHeaders);
    }
  }

  return null;
}
