import { type ProfileSettingsTab } from "../../components/ProfileSettingsShell";
import { type ProfileCollection } from "../../api/profile.api";

export function getProfileRoute(search: string) {
  const requestedSettings = new URLSearchParams(search).get("settings");
  const settingsTab: ProfileSettingsTab | null = requestedSettings === "profile" || requestedSettings === "authentication" || requestedSettings === "avatar" || requestedSettings === "connections" ? requestedSettings : null;
  const requestedView = new URLSearchParams(search).get("view");
  const profileView = requestedView === "collection" || requestedView === "reviews" || requestedView === "lists" || requestedView === "following" || requestedView === "followers" || requestedView === "ratings" ? requestedView : null;
  const requestedReviewValue = profileView === "reviews" ? new URLSearchParams(search).get("review") : null;
  const requestedReviewId = requestedReviewValue !== null && /^\d+$/.test(requestedReviewValue) && Number.isSafeInteger(Number(requestedReviewValue)) && Number(requestedReviewValue) > 0 ? Number(requestedReviewValue) : null;
  const networkView = profileView === "following" || profileView === "followers";
  const requestedCollection = new URLSearchParams(search).get("collection");
  const collectionKind: ProfileCollection = requestedCollection === "watchlist" || requestedCollection === "favorites" ? requestedCollection : "watched";
  return { settingsTab, profileView, requestedReviewValue, requestedReviewId, networkView, collectionKind };
}

export type ProfileRoute = ReturnType<typeof getProfileRoute>;
