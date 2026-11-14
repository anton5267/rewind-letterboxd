import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  type NotificationPage,
} from "../api/notifications.api";
import { usesHostedSupabaseAuth } from "../api/supabaseClient";
import { isDocumentVisible } from "../utils/documentVisibility";
import { notifyUnreadCountsChanged } from "../utils/unreadEvents";

interface Options {
  userId: number | null;
  page: number;
  unread: number;
  paused: boolean;
  onNotifications(data: NotificationPage): void;
  onUnread(count: number): void;
  onLocalNotification(): void;
}

export function useNotificationUpdates(options: Options) {
  const scope = `${options.userId}:${options.page}`;
  const latest = useRef(options);
  latest.current = options;
  const refreshAction = useRef(() => {});
  const [state, setState] = useState({
    scope,
    error: false,
    refreshing: false,
  });

  useEffect(() => {
    if (!usesHostedSupabaseAuth || options.userId === null || options.paused) {
      return;
    }
    let current = true;
    let pending = false;
    const isCurrent = () =>
      current && !latest.current.paused && isDocumentVisible() &&
      latest.current.userId === options.userId &&
      latest.current.page === options.page;
    const updateState = (patch: Partial<Omit<typeof state, "scope">>) => {
      setState((value) => ({
        ...(value.scope === scope
          ? value
          : { scope, error: false, refreshing: false }),
        ...patch,
      }));
    };
    const refresh = async () => {
      if (pending || !isCurrent()) return;
      pending = true;
      updateState({ refreshing: true });
      try {
        const [notifications, count] = await Promise.allSettled([
          getNotifications(options.page),
          getUnreadNotificationCount(),
        ]);
        if (!isCurrent()) return;
        if (notifications.status === "fulfilled") {
          latest.current.onNotifications(notifications.value.data);
        }
        if (count.status === "fulfilled") {
          const changed = count.value.data.count !== latest.current.unread;
          latest.current.onUnread(count.value.data.count);
          if (changed) notifyUnreadCountsChanged("notifications");
        }
        updateState({
          error: notifications.status === "rejected" ||
            count.status === "rejected",
        });
      } finally {
        pending = false;
        if (current) updateState({ refreshing: false });
      }
    };
    refreshAction.current = () => {
      void refresh();
    };
    const resume = () => {
      void refresh();
    };
    const timer = window.setInterval(resume, 15000);
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
  }, [options.userId, options.page, options.paused, scope]);

  useEffect(() => {
    if (usesHostedSupabaseAuth || options.userId === null) return;
    let source: EventSource | null = null;
    let retry: number | undefined;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource("/api/notifications/stream");
      source.addEventListener("notification", () => {
        if (stopped || latest.current.userId !== options.userId) return;
        notifyUnreadCountsChanged("notifications");
        latest.current.onLocalNotification();
      });
      source.onerror = () => {
        source?.close();
        if (retry) window.clearTimeout(retry);
        if (!stopped) retry = window.setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      stopped = true;
      source?.close();
      if (retry) window.clearTimeout(retry);
    };
  }, [options.userId]);

  return {
    error: state.scope === scope && state.error,
    refreshing: state.scope === scope && state.refreshing,
    refresh: () => refreshAction.current(),
  };
}
