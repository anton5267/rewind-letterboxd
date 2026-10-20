export type UnreadScope = "messages" | "notifications" | "all";

export const UNREAD_COUNTS_CHANGED_EVENT = "rewind:unread-counts-changed";

export function notifyUnreadCountsChanged(scope: UnreadScope) {
  window.dispatchEvent(new CustomEvent<UnreadScope>(UNREAD_COUNTS_CHANGED_EVENT, { detail: scope }));
}
