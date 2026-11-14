import type { ReviewReportReason } from "./reviews.ts";

export interface AdminReviewResponse {
  id: number; movieId: number; movieTitle: string; userId: number; username: string; content: string;
  rating: number | null; isHidden: boolean; moderatedReason: string | null; moderatedAt: string | null; createdAt: string;
}

export interface AdminReviewContentUpdate { content: string }

export interface AdminReportedReviewResponse extends AdminReviewResponse {
  reportId: number; reportReason: ReviewReportReason; reportCreatedAt: string; likesCount: number; commentsCount: number;
}

export interface AdminCommentResponse {
  id: number; reviewId: number | null; listId?: number | null; userId: number; username: string; content: string; isHidden: boolean;
  moderatedReason: string | null; moderatedAt: string | null; createdAt: string;
}

export interface AdminReportedCommentResponse extends AdminCommentResponse {
  reportId: number; reportReason: ReviewReportReason; reportCreatedAt: string;
}

export interface AdminModerationQueueItem {
  type: "REVIEW" | "COMMENT"; id: number; parentId: number | null; movieId: number | null;
  subject: string; userId: number; username: string; content: string; createdAt: string;
}

export interface AdminModerationTarget { type: string; id: number }

export interface AdminNotificationResponse {
  id: number; recipientId: number; actorId: number | null; type: "FOLLOW" | "REVIEW_LIKED";
  reviewId: number | null; createdAt: string; readAt: string | null;
}

export interface AdminConversationResponse {
  id: number; userOneId: number; userTwoId: number; messageCount: number;
  createdAt: string; updatedAt: string; lastMessageAt: string | null;
}

export interface AdminCreateNotificationRequest {
  recipientId: number; type: "FOLLOW" | "REVIEW_LIKED"; actorId: number;
  relatedUserId?: number | null; reviewId?: number | null;
}

export interface AdminUserResponse {
  id: number; username: string; displayName: string | null; email: string; role: string;
  avatarUrl: string | null; isActive: boolean; isHq: boolean; createdAt: string | null;
}

export interface AdminUserUpdateRequest {
  username?: string; displayName?: string; avatarUrl?: string; role?: "USER" | "ADMIN"; isActive?: boolean;
}

export interface AdminUserOverviewResponse {
  stats: { watched: number; reviews: number; ratings: number; watchlist: number; favorites: number; comments: number; likesReceived: number; followers: number; customLists: number };
  adminHistory: { id: number; adminId: number; action: string; targetType: string; targetId: number | null; metadata: string | null; createdAt: string }[];
}

export interface AdminListResponse {
  id: number; userId: number; username: string; name: string; description: string | null;
  listType: "CUSTOM" | "WATCHED" | "WATCHLIST" | "FAVORITES"; isPublic: boolean; itemCount: number;
  createdAt: string; updatedAt: string; featuredPosition: number | null;
}

export interface AdminReportedListResponse extends AdminListResponse {
  reportId: number; reportReason: ReviewReportReason; reportCreatedAt: string;
}

export interface AdminAuditLogResponse {
  id: number; adminId: number; action: string; targetType: string; targetId: number | null; metadata: string | null; createdAt: string;
}

export interface AdminDashboardResponse { users: number; activeUsers: number; hqUsers: number; movies: number; reviews: number; hiddenReviews: number }

export interface AdminSettingResponse { key: string; value: string; updatedBy: number | null; updatedAt: string }

export interface AdminMovieResponse { id: number; tmdbId: number | null; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null; published: boolean }

export interface AdminMovieCatalogResponse extends AdminMovieResponse {
  durationMinutes: number | null; ageRating: string | null; reviewCount: number;
}

export interface AdminTmdbMovieCandidate { tmdbId: number; title: string; releaseDate: string | null; overview: string | null; posterUrl: string | null }

export interface AdminMovieWriteRequest {
  title?: string; imdbId?: string | null; durationMinutes?: number | null; releaseDate?: string | null;
  originalLanguage?: string | null; ageRating?: string | null; rating?: number | null; shortPlot?: string | null;
  photoUrl?: string | null; backdropUrl?: string | null; trailerUrl?: string | null; published?: boolean; genreIds?: number[];
  actorCredits?: { actorId: number; characterName: string | null; castOrder: number | null }[];
  directorIds?: number[]; producerIds?: number[];
}

export interface AdminTmdbQualityReport {
  totalMovies: number; tmdbLinkedMovies: number; completeTmdbMovies: number; missingPoster: number;
  missingBackdrop: number; missingPlot: number; missingRuntime: number; missingTrailer: number;
  missingTmdbRating: number; missingOriginalLanguage: number; linkedCoveragePercent: number; metadataCompletenessPercent: number;
}

export interface AdminTmdbSyncResponse {
  movieId: number; tmdbId: number; title: string; genresUpdated: number; actorsUpdated: number;
  directorsUpdated: number; producersUpdated: number; similarMoviesLinked: number; trailerUpdated: boolean;
}

export interface AdminTmdbBatchResponse {
  requested: number; succeeded: number; failed: number;
  items: { movieId: number | null; tmdbId: number; status: string; title: string | null; message: string }[];
}

export interface AdminTmdbDiscoveryResponse {
  page: number; totalPages: number; totalResults: number; discovered: number; imports: AdminTmdbBatchResponse;
}

export interface AdminTmdbSyncInput { movieId: number; tmdbId: number; syncSimilar: boolean }

export interface AdminTmdbDiscoveryInput { page: number; year: number | null; genreId: number | null; minRating: number | null; limit: number; syncSimilar: boolean }
