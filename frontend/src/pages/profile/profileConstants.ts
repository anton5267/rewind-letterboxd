import { type TranslationKey } from "../../i18n";
import { type ProfileCollection } from "../../api/profile.api";

export const collectionKinds = ["watched", "watchlist", "favorites"] as const;
export type SocialLinkPlatform = "website" | "instagram" | "tiktok" | "letterboxd";
export const socialLinkPlatforms = ["website", "instagram", "tiktok", "letterboxd"] as const satisfies readonly SocialLinkPlatform[];
export const profileNavigation = [
  { id: "profile-overview", label: "profile", collectionKind: null },
  { id: "profile-collections", label: "films", collectionKind: "watched" },
  { id: "profile-collections", label: "watchlist", collectionKind: "watchlist" },
  { id: "profile-collections", label: "likes", collectionKind: "favorites" },
  { id: "profile-lists", label: "searchLists", collectionKind: null },
] as const satisfies readonly { id: string; label: TranslationKey; collectionKind: ProfileCollection | null }[];
export const profileSectionIds = ["profile-overview", "profile-collections", "profile-ratings", "profile-reviews", "profile-lists", "profile-following", "profile-followers", "profile-statistics"];
export const legacySettingsAnchors = new Set(["profile-identity-form-title", "profile-avatar-url", "social-links-settings", "newsletter-settings", "profile-delete-form-title", "profile-password-form-title"]);
export const overviewNavigation = [
  ...profileNavigation.slice(1),
  { id: "profile-following", label: "following", collectionKind: null },
  { id: "profile-followers", label: "followers", collectionKind: null },
] as const;
