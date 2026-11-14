import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  type Conversation,
  getConversations,
  getMessages,
  markConversationRead,
  type Message,
} from "../api/messages.api";
import type { Page } from "../api/types";
import { isDocumentVisible } from "../utils/documentVisibility";
import { notifyUnreadCountsChanged } from "../utils/unreadEvents";

interface Options {
  userId: number | null;
  conversationId: number | null;
  conversationPage: number;
  messagePage: number;
  latestMessageId: number | null;
  paused: boolean;
  readRequest: MutableRefObject<number>;
  onConversations(data: Page<Conversation>): void;
  onMessages(data: Page<Message>): void;
  onConversationsUnavailable(): void;
  onMessagesUnavailable(): void;
  onReadError(error: boolean): void;
}

function unavailable(error: unknown) {
  return isAxiosError(error) &&
    (error.response?.status === 403 || error.response?.status === 404);
}

export function useMessageUpdates(options: Options) {
  const scope = `${options.userId}:${options.conversationId}`;
  const latest = useRef(options);
  latest.current = options;
  const refreshAction = useRef(() => {});
  const seenHead = useRef({ scope, id: 0 });
  const [state, setState] = useState({
    scope,
    error: false,
    refreshing: false,
    hasNewMessages: false,
  });

  useEffect(() => {
    if (seenHead.current.scope !== scope) seenHead.current = { scope, id: 0 };
    if (options.messagePage === 0 && options.latestMessageId !== null) {
      seenHead.current.id = options.latestMessageId;
      setState((current) =>
        current.scope === scope && !current.hasNewMessages
          ? current
          : { scope, error: false, refreshing: false, hasNewMessages: false }
      );
    }
  }, [options.latestMessageId, options.messagePage, scope]);

  useEffect(() => {
    if (options.userId === null || options.paused) return;
    let current = true;
    let pending = false;
    const isCurrent = () =>
      current && !latest.current.paused && isDocumentVisible() &&
      latest.current.userId === options.userId &&
      latest.current.conversationId === options.conversationId &&
      latest.current.conversationPage === options.conversationPage &&
      latest.current.messagePage === options.messagePage;
    const updateState = (patch: Partial<Omit<typeof state, "scope">>) => {
      setState((value) => ({
        ...(value.scope === scope
          ? value
          : { scope, error: false, refreshing: false, hasNewMessages: false }),
        ...patch,
      }));
    };
    const refresh = async () => {
      if (pending || !isCurrent()) return;
      pending = true;
      updateState({ refreshing: true });
      try {
        const [conversations, messages] = await Promise.allSettled(
          [
            getConversations(options.conversationPage),
            options.conversationId === null
              ? Promise.resolve(null)
              : getMessages(options.conversationId, 0),
          ] as const,
        );
        if (!isCurrent()) return;
        let failed = false;
        if (conversations.status === "fulfilled") {
          latest.current.onConversations(conversations.value.data);
        } else if (unavailable(conversations.reason)) {
          latest.current.onConversationsUnavailable();
        } else failed = true;

        if (messages.status === "fulfilled" && messages.value !== null) {
          const data = messages.value.data;
          const head = data.content[0]?.id ?? 0;
          if (options.messagePage === 0) {
            latest.current.onMessages(data);
            seenHead.current = { scope, id: head };
            updateState({ hasNewMessages: false });
            if (
              data.content.some((message) =>
                message.senderId !== options.userId && message.readAt === null
              ) && isCurrent()
            ) {
              const generation = ++options.readRequest.current;
              try {
                await markConversationRead(options.conversationId!);
                if (isCurrent() && options.readRequest.current === generation) {
                  latest.current.onReadError(false);
                  notifyUnreadCountsChanged("messages");
                }
              } catch {
                if (isCurrent() && options.readRequest.current === generation) {
                  latest.current.onReadError(true);
                }
              }
            }
          } else if (head > seenHead.current.id) {
            updateState({ hasNewMessages: true });
          }
        } else if (messages.status === "rejected") {
          if (unavailable(messages.reason)) {
            latest.current.onMessagesUnavailable();
          } else failed = true;
        }
        if (isCurrent()) updateState({ error: failed });
      } finally {
        pending = false;
        if (current) updateState({ refreshing: false });
      }
    };
    refreshAction.current = () => {
      void refresh();
    };
    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);
    const resume = () => {
      void refresh();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      current = false;
      refreshAction.current = () => {};
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      setState((value) =>
        value.scope === scope && value.refreshing
          ? { ...value, refreshing: false }
          : value
      );
    };
  }, [
    options.conversationId,
    options.conversationPage,
    options.messagePage,
    options.paused,
    options.userId,
    scope,
  ]);

  return {
    error: state.scope === scope && state.error,
    refreshing: state.scope === scope && state.refreshing,
    hasNewMessages: state.scope === scope && options.messagePage > 0 &&
      state.hasNewMessages,
    refresh: () => refreshAction.current(),
  };
}
