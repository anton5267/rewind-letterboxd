import type { HttpRouteContext } from "../context.ts";
import type { NotificationPreferencesResponse } from "../../contracts/social.ts";
import { parseRouteId, parseSocialPage } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const NOTIFICATION_PATHS = new Set(["/api/notifications", "/api/notifications/unread-count", "/api/notifications/read-all", "/api/notifications/preferences"]);
const NOTIFICATION_READ_PATTERN = /^\/api\/notifications\/(\d+)\/read$/;
const CONVERSATION_PATHS = new Set(["/api/conversations", "/api/conversations/unread-count"]);
const CONVERSATION_MESSAGES_PATTERN = /^\/api\/conversations\/(\d+)\/messages$/;
const CONVERSATION_READ_PATTERN = /^\/api\/conversations\/(\d+)\/read$/;

export async function handleCommunicationRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const notificationReadMatch = path.match(NOTIFICATION_READ_PATTERN);

  if (NOTIFICATION_PATHS.has(path) || notificationReadMatch) {
    const allowed = path === "/api/notifications" || path === "/api/notifications/unread-count" || path === "/api/notifications/preferences"
      ? path.endsWith("/preferences") ? ["GET", "PUT"] : ["GET"]
      : ["POST"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (path === "/api/notifications/unread-count") {
        if (!repository.getUnreadNotificationCount) return json({ message: "Not found" }, 404, corsHeaders);
        return json({ count: await repository.getUnreadNotificationCount(authUser) }, 200, corsHeaders);
      }
      if (path === "/api/notifications/read-all") {
        if (!repository.markAllNotificationsRead) return json({ message: "Not found" }, 404, corsHeaders);
        await repository.markAllNotificationsRead(authUser);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (notificationReadMatch) {
        const notificationId = parseRouteId(notificationReadMatch[1]);
        if (notificationId === null) return json({ message: "Invalid notification ID" }, 400, corsHeaders);
        if (!repository.markNotificationRead) return json({ message: "Not found" }, 404, corsHeaders);
        if (!await repository.markNotificationRead(authUser, notificationId)) return json({ message: "Notification not found" }, 404, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (path === "/api/notifications/preferences") {
        if (request.method === "GET") {
          if (!repository.getNotificationPreferences) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getNotificationPreferences(authUser), 200, corsHeaders);
        }
        if (!repository.updateNotificationPreferences) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        if (!body || typeof body !== "object" || typeof (body as { followsEnabled?: unknown }).followsEnabled !== "boolean"
          || typeof (body as { reviewLikesEnabled?: unknown }).reviewLikesEnabled !== "boolean") {
          return json({ message: "Invalid notification preferences" }, 400, corsHeaders);
        }
        const preferences = body as NotificationPreferencesResponse;
        return json(await repository.updateNotificationPreferences(authUser, preferences), 200, corsHeaders);
      }
      if (!repository.getNotifications) return json({ message: "Not found" }, 404, corsHeaders);
      const { page, size } = parseSocialPage(query);
      return json(await repository.getNotifications(authUser, page, size), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load notifications", corsHeaders);
    }
  }

  const conversationMessagesMatch = path.match(CONVERSATION_MESSAGES_PATTERN);

  const conversationReadMatch = path.match(CONVERSATION_READ_PATTERN);

  if (CONVERSATION_PATHS.has(path) || conversationMessagesMatch || conversationReadMatch) {
    const isConversationList = path === "/api/conversations";
    const isUnreadCount = path === "/api/conversations/unread-count";
    const isStart = isConversationList && request.method === "POST";
    const isMessageRoute = conversationMessagesMatch !== null;
    const isReadRoute = conversationReadMatch !== null;
    const allowed = isConversationList ? ["GET", "POST"] : isMessageRoute ? ["GET", "POST"] : isReadRoute ? ["POST"] : ["GET"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (isUnreadCount) {
        if (!repository.getUnreadMessageCount) return json({ message: "Not found" }, 404, corsHeaders);
        return json({ count: await repository.getUnreadMessageCount(authUser) }, 200, corsHeaders);
      }
      if (isStart) {
        if (!repository.startConversation) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const targetId = (body as { userId?: unknown } | null)?.userId;
        if (typeof targetId !== "number" || !Number.isSafeInteger(targetId) || targetId <= 0) return json({ message: "Invalid user ID" }, 400, corsHeaders);
        const conversation = await repository.startConversation(authUser, targetId);
        return conversation ? json(conversation, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
      }
      if (isConversationList) {
        if (!repository.getConversations) return json({ message: "Not found" }, 404, corsHeaders);
        const { page, size } = parseSocialPage(query);
        return json(await repository.getConversations(authUser, page, size), 200, corsHeaders);
      }
      if (isReadRoute) {
        if (!repository.markConversationRead) return json({ message: "Not found" }, 404, corsHeaders);
        const conversationId = parseRouteId(conversationReadMatch![1]);
        if (conversationId === null) return json({ message: "Invalid conversation ID" }, 400, corsHeaders);
        if (!await repository.markConversationRead(authUser, conversationId)) return json({ message: "Conversation not found" }, 404, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      const conversationId = parseRouteId(conversationMessagesMatch![1]);
      if (conversationId === null) return json({ message: "Invalid conversation ID" }, 400, corsHeaders);
      if (request.method === "GET") {
        if (!repository.getConversationMessages) return json({ message: "Not found" }, 404, corsHeaders);
        const { page, size } = parseSocialPage(query);
        const result = await repository.getConversationMessages(authUser, conversationId, page, size);
        return result ? json(result, 200, corsHeaders) : json({ message: "Conversation not found" }, 404, corsHeaders);
      }
      if (!repository.sendConversationMessage) return json({ message: "Not found" }, 404, corsHeaders);
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const text = (body as { body?: unknown } | null)?.body;
      if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) return json({ message: "Message body cannot be blank or exceed 2000 characters" }, 400, corsHeaders);
      const message = await repository.sendConversationMessage(authUser, conversationId, text.trim());
      return message ? json(message, 200, corsHeaders) : json({ message: "Conversation not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load conversations", corsHeaders);
    }
  }

  return null;
}
