import type { HttpRouteContext } from "../context.ts";
import type { AdminNotificationResponse } from "../../contracts/admin.ts";
import { INVALID_QUERY, parseAdminPage, parseOptionalBoolean, parseOptionalLong, parseRouteId } from "../parsers/query.ts";
import { parseAdminCreateNotification } from "../parsers/admin.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const ADMIN_CONVERSATIONS_PATH = "/api/admin/conversations";
const ADMIN_CONVERSATION_PATTERN = /^\/api\/admin\/conversations\/(\d+)$/;
const ADMIN_NOTIFICATIONS_PATH = "/api/admin/notifications";
const ADMIN_NOTIFICATION_PATTERN = /^\/api\/admin\/notifications\/(\d+)(?:\/(read|unread))?$/;
const ADMIN_NOTIFICATION_READ_ALL_PATH = "/api/admin/notifications/read-all";

export async function handleAdminCommunicationRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const adminConversationMatch = path.match(ADMIN_CONVERSATION_PATTERN);

  if (path === ADMIN_CONVERSATIONS_PATH || adminConversationMatch) {
    const allowed = adminConversationMatch ? ["DELETE"] : ["GET"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (!adminConversationMatch) {
        const page = parseAdminPage(query, 100, 50);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        if (!repository.getAdminConversations) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminConversations(authUser, page.page, page.size), 200, corsHeaders);
      }
      const id = parseRouteId(adminConversationMatch[1]);
      if (id === null) return json({ message: "Invalid conversation ID" }, 400, corsHeaders);
      if (!repository.deleteAdminConversation) return json({ message: "Not found" }, 404, corsHeaders);
      if (!await repository.deleteAdminConversation(authUser, id)) return json({ message: "Conversation not found" }, 404, corsHeaders);
      return new Response(null, { status: 200, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to manage conversation", corsHeaders);
    }
  }

  const adminNotificationMatch = path.match(ADMIN_NOTIFICATION_PATTERN);

  if (path === ADMIN_NOTIFICATIONS_PATH || path === ADMIN_NOTIFICATION_READ_ALL_PATH || adminNotificationMatch) {
    const idText = adminNotificationMatch?.[1] ?? null;
    const action = adminNotificationMatch?.[2] ?? null;
    const allowed = path === ADMIN_NOTIFICATIONS_PATH ? ["GET", "POST", "DELETE"]
      : path === ADMIN_NOTIFICATION_READ_ALL_PATH ? ["PATCH"]
      : idText !== null && action !== null ? ["PATCH"] : ["DELETE"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      const typeValue = query.get("type");
      if (typeValue !== null && typeValue !== "" && typeValue !== "FOLLOW" && typeValue !== "REVIEW_LIKED") return json({ message: "Invalid notification type" }, 400, corsHeaders);
      const type: AdminNotificationResponse["type"] | null = typeValue === null || typeValue === "" ? null : typeValue as AdminNotificationResponse["type"];
      const read = parseOptionalBoolean(query.get("read"));
      const recipientId = parseOptionalLong(query.get("recipientId"));
      if (read === INVALID_QUERY || recipientId === INVALID_QUERY) return json({ message: "Invalid notification filter" }, 400, corsHeaders);
      const filters = { type, read, recipientId };
      if (path === ADMIN_NOTIFICATIONS_PATH && request.method === "GET") {
        const page = parseAdminPage(query, 100, 50);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        if (!repository.getAdminNotifications) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminNotifications(authUser, filters, page.page, page.size), 200, corsHeaders);
      }
      if (path === ADMIN_NOTIFICATIONS_PATH && request.method === "POST") {
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const parsed = parseAdminCreateNotification(body);
        if (!parsed) return json({ message: "Invalid notification" }, 400, corsHeaders);
        if (!repository.createAdminNotification) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.createAdminNotification(authUser, parsed), 200, corsHeaders);
      }
      if (path === ADMIN_NOTIFICATIONS_PATH && request.method === "DELETE") {
        if (!repository.deleteAdminNotifications) return json({ message: "Not found" }, 404, corsHeaders);
        return json({ deleted: await repository.deleteAdminNotifications(authUser, filters) }, 200, corsHeaders);
      }
      if (path === ADMIN_NOTIFICATION_READ_ALL_PATH) {
        if (!repository.markAdminNotificationsRead) return json({ message: "Not found" }, 404, corsHeaders);
        return json({ updated: await repository.markAdminNotificationsRead(authUser, type, recipientId) }, 200, corsHeaders);
      }
      const id = parseRouteId(idText!);
      if (id === null) return json({ message: "Invalid notification ID" }, 400, corsHeaders);
      if (action) {
        if (!repository.setAdminNotificationRead) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.setAdminNotificationRead(authUser, id, action === "read");
        return result ? json(result, 200, corsHeaders) : json({ message: "Notification not found" }, 404, corsHeaders);
      }
      if (!repository.deleteAdminNotification) return json({ message: "Not found" }, 404, corsHeaders);
      if (!await repository.deleteAdminNotification(authUser, id)) return json({ message: "Notification not found" }, 404, corsHeaders);
      return new Response(null, { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("Admin notifications operation failed", error);
      return repositoryFailure(error, "Unable to manage notifications", corsHeaders);
    }
  }

  return null;
}
