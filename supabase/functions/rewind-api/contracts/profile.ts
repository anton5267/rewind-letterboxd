export type ReplyPreference = "ANYONE" | "FOLLOWED" | "SELF";

export interface ProfileResponse {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  bio?: string | null;
  location?: string | null;
  pronoun?: string | null;
  replyPreference?: ReplyPreference;
  supabaseLinked: boolean;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  lists: { id: number; name: string; listType: string; isPublic: boolean }[];
  recentRatings: { movieId: number; movieTitle: string; moviePhotoUrl: string | null; rating: number; updatedAt: string }[];
  recentReviews: { reviewId: number; movieId: number; movieTitle: string; moviePhotoUrl: string | null; content: string; updatedAt: string }[];
}

export interface ProfileCollectionResult {
  content: unknown[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  pronoun?: string;
  replyPreference?: ReplyPreference;
}

export interface PublicProfileResponse {
  id: number; username: string; displayName: string; avatarUrl: string | null; bio?: string | null; location?: string | null; pronoun?: string | null; hq: boolean;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  ratingDistribution: { rating: number; count: number }[];
  socialLinks: { platform: string; url: string }[];
  lists: { id: number; name: string; description: string | null }[];
  recentReviews: { id: number; movieId: number; movieTitle: string; content: string; rating: number | null; updatedAt: string }[];
}
