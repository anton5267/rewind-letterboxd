import { type PublicCollection } from "../../api/profile.api";
import { type TranslationKey } from "../../i18n";

export type PublicProfileView = "collection" | "lists" | "following" | "followers" | null;

export const publicCollectionKinds = ["watched", "watchlist", "favorites"] as const;

export const publicProfileNavigation = [
  { id: "public-profile-overview", label: "profile", collectionKind: null },
  { id: "public-profile-collections", label: "films", collectionKind: "watched" },
  { id: "public-profile-collections", label: "watchlist", collectionKind: "watchlist" },
  { id: "public-profile-collections", label: "likes", collectionKind: "favorites" },
  { id: "public-profile-lists", label: "searchLists", collectionKind: null },
] as const satisfies readonly { id: string; label: TranslationKey; collectionKind: PublicCollection | null }[];

export const publicProfileSectionIds = ["public-profile-overview", "public-profile-stats", "public-profile-collections", "public-profile-liked-reviews", "public-profile-lists", "public-profile-following", "public-profile-followers"];

export const mobileCollectionNavigation = [
  ...publicProfileNavigation.slice(1),
  { id: "public-profile-following", label: "following", collectionKind: null },
  { id: "public-profile-followers", label: "followers", collectionKind: null },
] as const;
