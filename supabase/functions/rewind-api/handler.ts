export interface GenreResponse {
  id: number;
  name: string;
}

export interface MovieCardResponse {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export interface MovieSearchResult {
  content: MovieCardResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface MovieDetailsResponse {
  id: number;
  imdbId: string | null;
  tmdbId: number | null;
  title: string;
  durationMinutes: number | null;
  releaseDate: string | null;
  ageRating: string | null;
  rating: number | null;
  shortPlot: string | null;
  photoUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  genres: { id: number; name: string }[];
  directors: { id: number; name: string; photoUrl: string | null }[];
  producers: { id: number; name: string; photoUrl: string | null }[];
  actors: { id: number; name: string; photoUrl: string | null; characterName: string | null; castOrder: number | null }[];
  externalRatings: { source: string; rating: number; votesCount: number | null; lastUpdatedAt: string | null }[];
  similarMovies: MovieCardResponse[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}

export interface MovieSearchParams {
  q: string | null;
  genreId: number | null;
  year: number | null;
  minRating: number | null;
  sort: string;
  page: number;
  size: number;
}

export interface PersonFilmographyResponse {
  id: number;
  name: string;
  photoUrl: string | null;
  type: "ACTOR" | "DIRECTOR" | "PRODUCER";
  films: {
    id: number;
    title: string;
    releaseDate: string | null;
    rating: number | null;
    photoUrl: string | null;
    characterName: string | null;
  }[];
}

export interface PersonSearchResult {
  content: {
    id: number;
    name: string;
    photoUrl: string | null;
    type: "ACTOR" | "DIRECTOR" | "PRODUCER";
    filmCount: number;
  }[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface PersonSearchParams {
  q: string | null;
  type: "ACTOR" | "DIRECTOR" | "PRODUCER";
  page: number;
  size: number;
}

export interface HostedAuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  username: string | null;
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  role: string;
  avatarUrl: string | null;
}

export interface MovieStatusResponse {
  inWatchlist: boolean;
  watched: boolean;
  favorite: boolean;
  myRating: number | null;
}

export type MovieFlagType = "watched" | "watchlist" | "favorite";

export interface ProfileResponse {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
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
}

export interface PublicSocialUser { id: number; username: string; displayName: string | null; avatarUrl: string | null }
export interface FollowStatusResponse { following: boolean; followers: number; followingCount: number }
export interface BlockStatusResponse { blocked: boolean }
export interface SocialLinkResponse { platform: string; url: string }
export interface NotificationResponse {
  id: number; type: "FOLLOW" | "REVIEW_LIKED"; createdAt: string; readAt: string | null;
  actor: { id: number; username: string; displayName: string | null; avatarUrl: string | null } | null;
  relatedUserId: number | null; reviewId: number | null;
}
export interface NotificationPreferencesResponse { followsEnabled: boolean; reviewLikesEnabled: boolean }
export interface JournalArticleResponse {
  id: number; slug: string; language: string; category: string; title: string; excerpt: string | null;
  content: string; coverUrl: string | null; audioUrl: string | null; publishedAt: string | null;
}
export interface JournalArchiveEntry { year: number; month: number; articleCount: number }
export interface NewsletterSubscriptionResponse { subscribed: boolean }
export interface AdminJournalArticleRequest {
  slug: string; language: "uk" | "en"; category: string; title: string; excerpt: string | null;
  content: string; coverUrl: string | null; audioUrl: string | null; published: boolean;
}
export interface AdminReviewResponse {
  id: number; movieId: number; movieTitle: string; userId: number; username: string; content: string;
  rating: number | null; isHidden: boolean; moderatedReason: string | null; moderatedAt: string | null; createdAt: string;
}
export type ReviewReportReason = "SPAM" | "INAPPROPRIATE_CONTENT" | "BULLYING";
export interface ReviewReportResponse { id: number; reason: ReviewReportReason; createdAt: string }
export interface ReviewReportStatusResponse { reported: boolean; report: ReviewReportResponse | null }
export interface AdminReportedReviewResponse extends AdminReviewResponse {
  reportId: number; reportReason: ReviewReportReason; reportCreatedAt: string; likesCount: number; commentsCount: number;
}
export interface AdminCommentResponse {
  id: number; reviewId: number; userId: number; username: string; content: string; isHidden: boolean;
  moderatedReason: string | null; moderatedAt: string | null; createdAt: string;
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
  createdAt: string; updatedAt: string;
}
export interface AdminAuditLogResponse {
  id: number; adminId: number; action: string; targetType: string; targetId: number | null; metadata: string | null; createdAt: string;
}
export interface AdminDashboardResponse { users: number; activeUsers: number; hqUsers: number; movies: number; reviews: number; hiddenReviews: number }
export interface AdminSettingResponse { key: string; value: string; updatedBy: number | null; updatedAt: string }
export interface NewsletterQueueResponse { articleId: number; recipients: number }
export interface NewsletterDeliveryStatusResponse { articleId: number; pending: number; sending: number; sent: number; failed: number; cancelled: number }
export interface AdminMovieResponse { id: number; tmdbId: number | null; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }
export interface AdminTmdbMovieCandidate { tmdbId: number; title: string; releaseDate: string | null; overview: string | null; posterUrl: string | null }
export interface AdminMovieWriteRequest {
  title?: string; imdbId?: string | null; durationMinutes?: number | null; releaseDate?: string | null;
  ageRating?: string | null; rating?: number | null; shortPlot?: string | null;
  photoUrl?: string | null; backdropUrl?: string | null; trailerUrl?: string | null;
}
export interface AdminTmdbQualityReport {
  totalMovies: number; tmdbLinkedMovies: number; completeTmdbMovies: number; missingPoster: number;
  missingBackdrop: number; missingPlot: number; missingRuntime: number; missingTrailer: number;
  missingTmdbRating: number; linkedCoveragePercent: number; metadataCompletenessPercent: number;
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
export interface MessageResponse { id: number; conversationId: number; senderId: number; body: string; createdAt: string; readAt: string | null }
export interface ConversationResponse {
  id: number; otherUser: PublicSocialUser; updatedAt: string;
  lastMessage: { id: number; senderId: number; body: string; createdAt: string; readAt: string | null } | null;
}
export interface PublicProfileResponse {
  id: number; username: string; displayName: string; avatarUrl: string | null; hq: boolean;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  ratingDistribution: { rating: number; count: number }[];
  socialLinks: { platform: string; url: string }[];
  lists: { id: number; name: string; description: string | null }[];
  recentReviews: { id: number; movieId: number; movieTitle: string; content: string; rating: number | null; updatedAt: string }[];
}
export interface ActivityResponse {
  id: number; type: "FOLLOW" | "RATING" | "REVIEW" | "LIST" | "WATCHED"; createdAt: string;
  actor: PublicSocialUser | null; movie: { id: number; title: string } | null;
  relatedUser: { id: number; username: string; displayName: string } | null;
  list: { id: number; name: string } | null;
}
export interface PopularReviewerResponse extends PublicSocialUser {
  likes: number; reviewCount: number; watchedCount: number; listCount: number;
}

export interface ReviewFeedResponse {
  content: {
    id: number; movieId: number; movieTitle: string; userId: number; username: string;
    content: string; rating: number | null; createdAt: string; moviePhotoUrl: string | null; userAvatarUrl: string | null;
  }[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface GlobalSearchArticleResponse {
  id: number; slug: string; category: string; title: string; excerpt: string | null;
  coverUrl: string | null; publishedAt: string | null;
}

export interface GlobalSearchResponse {
  films: MovieSearchResult;
  users: { content: PublicSocialUser[]; totalPages: number; totalElements: number; number: number };
  lists: PublicListPageResponse;
  tags: PopularTagResponse[];
  people: { id: number; name: string; photoUrl: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }[];
  reviews: ReviewFeedResponse;
  journal: { content: GlobalSearchArticleResponse[]; totalPages: number; totalElements: number; number: number };
}

export interface ReviewResponse {
  id: number;
  userId: number;
  username: string;
  userAvatarUrl: string | null;
  content: string;
  rating: number | null;
  createdAt: string;
}

export interface ReviewPageResponse {
  content: ReviewResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewDetailsResponse {
  id: number;
  content: string;
  rating: number | null;
  createdAt: string;
  author: { id: number; username: string; displayName: string | null; avatarUrl: string | null };
  movie: {
    id: number; title: string; releaseDate: string | null; durationMinutes: number | null;
    ageRating: string | null; photoUrl: string | null; backdropUrl: string | null; trailerUrl: string | null;
  };
  likes: number;
  likedBy: { id: number; username: string; displayName: string | null; avatarUrl: string | null }[];
}

export interface CommentResponse {
  id: number;
  reviewId: number;
  userId: number;
  username: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPageResponse {
  content: CommentResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewMutationRequest { content?: string; rating?: number | null }

export interface PublicListCardResponse {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: number;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
  tags: string[];
  likeCount: number;
  itemCount: number;
  previewMovies: MovieCardResponse[];
}

export interface PublicListDetailsResponse {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
  tags: string[];
  likeCount: number;
  movies: MovieCardResponse[];
}

export interface PublicListPageResponse {
  content: PublicListCardResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ListLikeStatusResponse { liked: boolean; likes: number }
export interface PopularTagResponse { id: number; name: string; slug: string }
export interface MyListResponse {
  id: number;
  name: string;
  description: string | null;
  listType: "CUSTOM" | "WATCHED" | "WATCHLIST" | "FAVORITES";
  isPublic: boolean;
  tags: string[];
}
export interface MyListPageResponse {
  content: MyListResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}
export interface MyListItemResponse {
  id: number;
  position: number | null;
  movie: MovieCardResponse;
}
export interface CreateMyListRequest {
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  movieIds: number[];
}
export interface UpdateMyListRequest {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  tags?: string[];
}

export class RewindApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export interface RewindApiRepository {
  listGenres(): Promise<GenreResponse[]>;
  searchMovies(params: MovieSearchParams): Promise<MovieSearchResult>;
  getMovieDetails(id: number): Promise<MovieDetailsResponse | null>;
  searchPeople(params: PersonSearchParams): Promise<PersonSearchResult>;
  searchGlobal?(query: string, language: string, size: number): Promise<GlobalSearchResponse>;
  getPersonFilmography(type: "ACTOR" | "DIRECTOR" | "PRODUCER", id: number, genreId: number | null, sort: string): Promise<PersonFilmographyResponse | null>;
  getPublicReviewFeed?(feed: "recent" | "popular", page: number, size: number): Promise<ReviewFeedResponse>;
  getMovieReviews?(movieId: number, page: number, size: number): Promise<ReviewPageResponse>;
  getMyMovieReview?(authUser: HostedAuthUser, movieId: number): Promise<ReviewResponse | null>;
  createReview?(authUser: HostedAuthUser, movieId: number, content: string, rating: number): Promise<ReviewResponse>;
  getReviewDetails?(reviewId: number): Promise<ReviewDetailsResponse | null>;
  getMyReviewReport?(authUser: HostedAuthUser, reviewId: number): Promise<ReviewReportStatusResponse | null>;
  reportReview?(authUser: HostedAuthUser, reviewId: number, reason: ReviewReportReason): Promise<ReviewReportResponse | null>;
  updateMyReview?(authUser: HostedAuthUser, reviewId: number, update: ReviewMutationRequest): Promise<ReviewResponse | null>;
  deleteMyReview?(authUser: HostedAuthUser, reviewId: number): Promise<boolean>;
  getReviewComments?(reviewId: number, page: number, size: number): Promise<CommentPageResponse>;
  createReviewComment?(authUser: HostedAuthUser, reviewId: number, text: string): Promise<CommentResponse | null>;
  updateReviewComment?(authUser: HostedAuthUser, commentId: number, text: string): Promise<CommentResponse | null | "FORBIDDEN">;
  deleteReviewComment?(authUser: HostedAuthUser, commentId: number): Promise<"OK" | "NOT_FOUND" | "FORBIDDEN">;
  getReviewLikes?(reviewId: number): Promise<number | null>;
  getReviewLikeStatus?(authUser: HostedAuthUser, reviewId: number): Promise<{ liked: boolean; likes: number } | null>;
  likeReview?(authUser: HostedAuthUser, reviewId: number): Promise<boolean>;
  unlikeReview?(authUser: HostedAuthUser, reviewId: number): Promise<boolean>;
  getPublicLists?(feed: "all" | "popular" | "recently-liked" | "team", tag: string | null, page: number, size: number): Promise<PublicListPageResponse>;
  getPopularTags?(size: number): Promise<PopularTagResponse[]>;
  getMyLists?(authUser: HostedAuthUser): Promise<MyListResponse[]>;
  getMyListsPage?(authUser: HostedAuthUser, page: number, size: number): Promise<MyListPageResponse>;
  createMyList?(authUser: HostedAuthUser, body: CreateMyListRequest): Promise<MyListResponse>;
  updateMyList?(authUser: HostedAuthUser, listId: number, body: UpdateMyListRequest): Promise<MyListResponse | null>;
  deleteMyList?(authUser: HostedAuthUser, listId: number): Promise<boolean>;
  getMyListItems?(authUser: HostedAuthUser, listId: number): Promise<MyListItemResponse[] | null>;
  addMovieToMyList?(authUser: HostedAuthUser, listId: number, movieId: number, position: number | null): Promise<"OK" | "LIST_NOT_FOUND" | "MOVIE_NOT_FOUND">;
  removeMovieFromMyList?(authUser: HostedAuthUser, listId: number, movieId: number): Promise<"OK" | "LIST_NOT_FOUND" | "LAST_MOVIE">;
  reorderMyListItems?(authUser: HostedAuthUser, listId: number, orderedItemIds: number[]): Promise<"OK" | "LIST_NOT_FOUND" | "INVALID_ORDER">;
  getPublicList?(listId: number): Promise<PublicListDetailsResponse | null>;
  getPublicListLikeStatus?(authUser: HostedAuthUser, listId: number): Promise<ListLikeStatusResponse | null>;
  likePublicList?(authUser: HostedAuthUser, listId: number): Promise<boolean>;
  unlikePublicList?(authUser: HostedAuthUser, listId: number): Promise<boolean>;
  getOrCreateCurrentUser?(authUser: HostedAuthUser): Promise<CurrentUserResponse>;
  getMyProfile?(authUser: HostedAuthUser): Promise<ProfileResponse>;
  updateMyProfile?(authUser: HostedAuthUser, update: ProfileUpdateRequest): Promise<void>;
  deleteMyAccount?(authUser: HostedAuthUser): Promise<boolean>;
  getMyProfileCollection?(authUser: HostedAuthUser, collection: string, page: number, size: number): Promise<ProfileCollectionResult>;
  getMyMovieStatus?(authUser: HostedAuthUser, movieId: number): Promise<MovieStatusResponse>;
  setMyMovieFlag?(authUser: HostedAuthUser, movieId: number, flag: MovieFlagType): Promise<void>;
  deleteMyMovieFlag?(authUser: HostedAuthUser, movieId: number, flag: MovieFlagType): Promise<void>;
  getMyRating?(authUser: HostedAuthUser, movieId: number): Promise<number | null>;
  setMyRating?(authUser: HostedAuthUser, movieId: number, rating: number): Promise<void>;
  deleteMyRating?(authUser: HostedAuthUser, movieId: number): Promise<void>;
  getPublicProfile?(userId: number): Promise<PublicProfileResponse | null>;
  getPublicProfileCollection?(userId: number, collection: "watched" | "watchlist" | "favorites", page: number, size: number): Promise<MovieSearchResult | null>;
  getPublicProfileLists?(userId: number, page: number, size: number): Promise<PublicListPageResponse | null>;
  getPublicProfileLikedReviews?(userId: number, page: number, size: number): Promise<{ content: PublicProfileResponse["recentReviews"]; totalPages: number; totalElements: number; number: number } | null>;
  getUserActivity?(userId: number, page: number, size: number): Promise<{ content: ActivityResponse[]; totalPages: number; totalElements: number; number: number } | null>;
  getFollowers?(userId: number, page: number, size: number): Promise<{ content: PublicSocialUser[]; totalPages: number; totalElements: number; number: number } | null>;
  getFollowing?(userId: number, page: number, size: number): Promise<{ content: PublicSocialUser[]; totalPages: number; totalElements: number; number: number } | null>;
  getFollowStatus?(authUser: HostedAuthUser, userId: number): Promise<FollowStatusResponse | null>;
  setFollow?(authUser: HostedAuthUser, userId: number, following: boolean): Promise<boolean>;
  getFollowingActivity?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: ActivityResponse[]; totalPages: number; totalElements: number; number: number }>;
  getRecentWatched?(size: number): Promise<{ content: { id: number; createdAt: string; actor: { id: number; username: string; displayName: string | null } | null; movie: { id: number; title: string } | null }[]; totalPages: number; totalElements: number; number: number }>;
  getPopularReviewers?(size: number): Promise<PopularReviewerResponse[]>;
  getHqUsers?(page: number, size: number): Promise<{ content: PublicSocialUser[]; totalPages: number; totalElements: number; number: number }>;
  getDirectoryUsers?(query: string | null, page: number, size: number): Promise<{ content: PublicSocialUser[]; totalPages: number; totalElements: number; number: number }>;
  getPublicUser?(userId: number): Promise<PublicSocialUser | null>;
  getBlockStatus?(authUser: HostedAuthUser, userId: number): Promise<BlockStatusResponse | null>;
  setBlock?(authUser: HostedAuthUser, userId: number, blocked: boolean): Promise<boolean | null>;
  getMySocialLinks?(authUser: HostedAuthUser): Promise<SocialLinkResponse[]>;
  updateMySocialLinks?(authUser: HostedAuthUser, links: SocialLinkResponse[]): Promise<SocialLinkResponse[]>;
  getNotifications?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: NotificationResponse[]; totalPages: number; totalElements: number; number: number }>;
  getUnreadNotificationCount?(authUser: HostedAuthUser): Promise<number>;
  markNotificationRead?(authUser: HostedAuthUser, notificationId: number): Promise<boolean>;
  markAllNotificationsRead?(authUser: HostedAuthUser): Promise<void>;
  getNotificationPreferences?(authUser: HostedAuthUser): Promise<NotificationPreferencesResponse>;
  updateNotificationPreferences?(authUser: HostedAuthUser, preferences: NotificationPreferencesResponse): Promise<NotificationPreferencesResponse>;
  getConversations?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: ConversationResponse[]; totalPages: number; totalElements: number; number: number }>;
  getUnreadMessageCount?(authUser: HostedAuthUser): Promise<number>;
  startConversation?(authUser: HostedAuthUser, targetUserId: number): Promise<ConversationResponse | null>;
  getConversationMessages?(authUser: HostedAuthUser, conversationId: number, page: number, size: number): Promise<{ content: MessageResponse[]; totalPages: number; totalElements: number; number: number } | null>;
  sendConversationMessage?(authUser: HostedAuthUser, conversationId: number, body: string): Promise<MessageResponse | null>;
  markConversationRead?(authUser: HostedAuthUser, conversationId: number): Promise<boolean>;
  getJournal?(language: string, category: string | null, year: number | null, month: number | null, page: number, size: number): Promise<{ content: JournalArticleResponse[]; totalPages: number; totalElements: number; number: number }>;
  getJournalArchive?(language: string): Promise<JournalArchiveEntry[]>;
  getJournalArticle?(language: string, slug: string): Promise<JournalArticleResponse | null>;
  getNewsletterSubscription?(authUser: HostedAuthUser): Promise<NewsletterSubscriptionResponse>;
  updateNewsletterSubscription?(authUser: HostedAuthUser, subscribed: boolean): Promise<NewsletterSubscriptionResponse>;
  getAdminReviews?(authUser: HostedAuthUser, filters: { movieId: number | null; userId: number | null; hidden: boolean | null }, page: number, size: number): Promise<{ content: AdminReviewResponse[]; totalPages: number; totalElements: number; number: number }>;
  getAdminReportedReviews?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: AdminReportedReviewResponse[]; totalPages: number; totalElements: number; number: number }>;
  dismissAdminReviewReport?(authUser: HostedAuthUser, reportId: number): Promise<boolean>;
  setAdminReviewHidden?(authUser: HostedAuthUser, id: number, hidden: boolean, reason: string | null): Promise<AdminReviewResponse | null>;
  deleteAdminReview?(authUser: HostedAuthUser, id: number): Promise<boolean>;
  getAdminComments?(authUser: HostedAuthUser, hidden: boolean | null, page: number, size: number): Promise<{ content: AdminCommentResponse[]; totalPages: number; totalElements: number; number: number }>;
  setAdminCommentHidden?(authUser: HostedAuthUser, id: number, hidden: boolean, reason: string | null): Promise<AdminCommentResponse | null>;
  deleteAdminComment?(authUser: HostedAuthUser, id: number): Promise<boolean>;
  getAdminModerationQueue?(authUser: HostedAuthUser, type: "REVIEW" | "COMMENT" | null, query: string | null, page: number, size: number): Promise<{ content: AdminModerationQueueItem[]; totalPages: number; totalElements: number; number: number }>;
  hideAdminModerationItem?(authUser: HostedAuthUser, type: "REVIEW" | "COMMENT", id: number, reason: string | null): Promise<void>;
  bulkHideAdminModeration?(authUser: HostedAuthUser, items: AdminModerationTarget[], reason: string): Promise<number>;
  getAdminConversations?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: AdminConversationResponse[]; totalPages: number; totalElements: number; number: number }>;
  deleteAdminConversation?(authUser: HostedAuthUser, id: number): Promise<boolean>;
  getAdminNotifications?(authUser: HostedAuthUser, filters: { type: AdminNotificationResponse["type"] | null; read: boolean | null; recipientId: number | null }, page: number, size: number): Promise<{ content: AdminNotificationResponse[]; totalPages: number; totalElements: number; number: number }>;
  createAdminNotification?(authUser: HostedAuthUser, body: AdminCreateNotificationRequest): Promise<AdminNotificationResponse>;
  setAdminNotificationRead?(authUser: HostedAuthUser, id: number, read: boolean): Promise<AdminNotificationResponse | null>;
  markAdminNotificationsRead?(authUser: HostedAuthUser, type: AdminNotificationResponse["type"] | null, recipientId: number | null): Promise<number>;
  deleteAdminNotification?(authUser: HostedAuthUser, id: number): Promise<boolean>;
  deleteAdminNotifications?(authUser: HostedAuthUser, filters: { type: AdminNotificationResponse["type"] | null; read: boolean | null; recipientId: number | null }): Promise<number>;
  getAdminUsers?(authUser: HostedAuthUser, query: string | null, page: number, size: number): Promise<{ content: AdminUserResponse[]; totalPages: number; totalElements: number; number: number }>;
  getAdminUser?(authUser: HostedAuthUser, id: number): Promise<AdminUserResponse | null>;
  getAdminUserOverview?(authUser: HostedAuthUser, id: number): Promise<AdminUserOverviewResponse | null>;
  updateAdminUser?(authUser: HostedAuthUser, id: number, update: AdminUserUpdateRequest): Promise<AdminUserResponse | null>;
  setAdminUserActive?(authUser: HostedAuthUser, id: number, active: boolean): Promise<boolean>;
  setAdminUserHq?(authUser: HostedAuthUser, id: number, hq: boolean): Promise<AdminUserResponse | null>;
  getAdminLists?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: AdminListResponse[]; totalPages: number; totalElements: number; number: number }>;
  setAdminListVisibility?(authUser: HostedAuthUser, id: number, visible: boolean): Promise<AdminListResponse | null>;
  deleteAdminList?(authUser: HostedAuthUser, id: number): Promise<"OK" | "NOT_FOUND" | "SYSTEM_LIST">;
  getAdminDashboard?(authUser: HostedAuthUser): Promise<AdminDashboardResponse>;
  getAdminAuditLogs?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: AdminAuditLogResponse[]; totalPages: number; totalElements: number; number: number }>;
  getAdminSettings?(authUser: HostedAuthUser): Promise<AdminSettingResponse[]>;
  updateAdminSetting?(authUser: HostedAuthUser, key: string, value: string): Promise<AdminSettingResponse | null>;
  queueAdminNewsletter?(authUser: HostedAuthUser, articleId: number): Promise<NewsletterQueueResponse>;
  getAdminNewsletterStatus?(authUser: HostedAuthUser, articleId: number): Promise<NewsletterDeliveryStatusResponse | null>;
  getAdminMovies?(authUser: HostedAuthUser, query: string | null, page: number, size: number): Promise<{ content: AdminMovieResponse[]; totalPages: number; totalElements: number; number: number }>;
  createAdminMovie?(authUser: HostedAuthUser, body: AdminMovieWriteRequest): Promise<AdminMovieResponse>;
  updateAdminMovie?(authUser: HostedAuthUser, id: number, body: AdminMovieWriteRequest): Promise<AdminMovieResponse | null>;
  deleteAdminMovie?(authUser: HostedAuthUser, id: number): Promise<boolean>;
  getAdminTmdbQuality?(authUser: HostedAuthUser): Promise<AdminTmdbQualityReport>;
  searchAdminMovieTmdbCandidates?(authUser: HostedAuthUser, movieId: number): Promise<AdminTmdbMovieCandidate[]>;
  syncAdminTmdbMovie?(authUser: HostedAuthUser, input: AdminTmdbSyncInput): Promise<AdminTmdbSyncResponse>;
  syncAdminTmdbBatch?(authUser: HostedAuthUser, inputs: AdminTmdbSyncInput[], syncSimilar: boolean): Promise<AdminTmdbBatchResponse>;
  importAdminTmdb?(authUser: HostedAuthUser, tmdbIds: number[], syncSimilar: boolean): Promise<AdminTmdbBatchResponse>;
  discoverAndImportAdminTmdb?(authUser: HostedAuthUser, input: AdminTmdbDiscoveryInput): Promise<AdminTmdbDiscoveryResponse>;
  getAdminJournalArticles?(authUser: HostedAuthUser, page: number, size: number): Promise<{ content: JournalArticleResponse[]; totalPages: number; totalElements: number; number: number }>;
  createAdminJournalArticle?(authUser: HostedAuthUser, body: AdminJournalArticleRequest): Promise<JournalArticleResponse>;
  updateAdminJournalArticle?(authUser: HostedAuthUser, id: number, body: AdminJournalArticleRequest): Promise<JournalArticleResponse | null>;
}

export interface RewindAuthVerifier {
  verifyAccessToken(token: string): Promise<HostedAuthUser | null>;
  verifyCurrentPassword?(user: HostedAuthUser, currentPassword: string): Promise<void>;
  changePassword?(user: HostedAuthUser, currentPassword: string, newPassword: string): Promise<void>;
  processPendingIdentityDeletion?(): Promise<void>;
}

const FUNCTION_PREFIX = "/functions/v1/rewind-api";
const GENRES_PATH = "/api/genres";
const MOVIES_SEARCH_PATH = "/api/movies/search";
const GLOBAL_SEARCH_PATH = "/api/search/global";
const MOVIE_DETAILS_PATTERN = /^\/api\/movies\/(\d+)\/details$/;
const MOVIE_RATING_PATTERN = /^\/api\/movies\/(\d+)\/rating(?:\/(me))?$/;
const MOVIE_STATUS_PATTERN = /^\/api\/movies\/(\d+)\/status\/me$/;
const MOVIE_FLAG_PATTERN = /^\/api\/movies\/(\d+)\/(watched|watchlist|favorite)$/;
const MY_PROFILE_PATH = "/api/profile/me";
const MY_PROFILE_PASSWORD_PATH = "/api/profile/me/password";
const MY_SOCIAL_LINKS_PATH = "/api/profile/me/social-links";
const MY_PROFILE_COLLECTION_PATTERN = /^\/api\/profile\/me\/(watched|watchlist|favorites|ratings|reviews)$/;
const PUBLIC_REVIEW_FEED_PATTERN = /^\/api\/reviews\/(recent|popular)$/;
const MOVIE_REVIEWS_PATTERN = /^\/api\/movies\/(\d+)\/reviews(?:\/(me))?$/;
const REVIEW_DETAILS_PATTERN = /^\/api\/reviews\/(\d+)$/;
const REVIEW_COMMENTS_PATTERN = /^\/api\/reviews\/(\d+)\/comments$/;
const REVIEW_LIKES_PATTERN = /^\/api\/reviews\/(\d+)\/(likes|like-status)$/;
const COMMENT_PATTERN = /^\/api\/comments\/(\d+)$/;
const PUBLIC_LIST_FEED_PATTERN = /^\/api\/lists\/public(?:\/(popular|recently-liked|team))?$/;
const PUBLIC_LIST_DETAILS_PATTERN = /^\/api\/lists\/public\/(\d+)(?:\/(like-status))?$/;
const PUBLIC_LIST_LIKE_PATTERN = /^\/api\/lists\/(\d+)\/likes$/;
const POPULAR_TAGS_PATH = "/api/tags/popular";
const MY_LISTS_PATH = "/api/lists/my";
const MY_LISTS_PAGE_PATH = "/api/lists/my/page";
const LIST_ID_PATTERN = /^\/api\/lists\/(\d+)$/;
const LIST_ITEMS_PATTERN = /^\/api\/lists\/(\d+)\/items$/;
const LIST_REORDER_PATTERN = /^\/api\/lists\/(\d+)\/items\/reorder$/;
const LIST_ADD_MOVIE_PATTERN = /^\/api\/lists\/(\d+)\/(?:items|movies)$/;
const LIST_REMOVE_MOVIE_PATTERN = /^\/api\/lists\/(\d+)\/(?:items|movies)\/(\d+)$/;
const PEOPLE_SEARCH_PATH = "/api/people/search";
const PERSON_FILMOGRAPHY_PATTERN = /^\/api\/(actors|directors|producers)\/([^/]+)$/;
const PUBLIC_PROFILE_PATTERN = /^\/api\/users\/(\d+)\/(profile|followers|following|follow-status|follow|block-status|block|activity|collections\/(watched|watchlist|favorites)|lists|liked-reviews)$/;
const FOLLOWING_ACTIVITY_PATH = "/api/activity/following";
const RECENT_WATCHED_PATH = "/api/activity/recent-watched";
const POPULAR_REVIEWERS_PATH = "/api/users/popular-reviewers";
const HQ_USERS_PATH = "/api/users/hq";
const USER_DIRECTORY_PATH = "/api/users/directory";
const PUBLIC_USER_PATTERN = /^\/api\/users\/(\d+)$/;
const NOTIFICATION_PATHS = new Set(["/api/notifications", "/api/notifications/unread-count", "/api/notifications/read-all", "/api/notifications/preferences"]);
const NOTIFICATION_READ_PATTERN = /^\/api\/notifications\/(\d+)\/read$/;
const CONVERSATION_PATHS = new Set(["/api/conversations", "/api/conversations/unread-count"]);
const CONVERSATION_MESSAGES_PATTERN = /^\/api\/conversations\/(\d+)\/messages$/;
const CONVERSATION_READ_PATTERN = /^\/api\/conversations\/(\d+)\/read$/;
const JOURNAL_PATH = "/api/journal/articles";
const JOURNAL_ARCHIVE_PATH = "/api/journal/articles/archive";
const JOURNAL_ARTICLE_PATTERN = /^\/api\/journal\/articles\/([^/]+)$/;
const NEWSLETTER_SUBSCRIPTION_PATH = "/api/newsletter/subscription";
const ADMIN_JOURNAL_PATH = "/api/admin/journal/articles";
const ADMIN_JOURNAL_ARTICLE_PATTERN = /^\/api\/admin\/journal\/articles\/(\d+)(?:\/(newsletter))?$/;
const REVIEW_REPORT_PATTERN = /^\/api\/reviews\/(\d+)\/report$/;
const ADMIN_REPORTED_REVIEWS_PATH = "/api/admin/reported-reviews";
const ADMIN_REPORTED_REVIEW_DISMISS_PATTERN = /^\/api\/admin\/reported-reviews\/(\d+)\/dismiss$/;
const ADMIN_REVIEW_PATTERN = /^\/api\/admin\/reviews(?:\/(\d+)(?:\/(hide|unhide))?)?$/;
const ADMIN_COMMENT_PATTERN = /^\/api\/admin\/comments(?:\/(\d+)(?:\/(hide|unhide))?)?$/;
const ADMIN_MODERATION_HIDE_PATTERN = /^\/api\/admin\/moderation\/([^/]+)\/(\d+)\/hide$/;
const ADMIN_MODERATION_QUEUE_PATH = "/api/admin/moderation/queue";
const ADMIN_MODERATION_BULK_PATH = "/api/admin/moderation/bulk-hide";
const ADMIN_CONVERSATIONS_PATH = "/api/admin/conversations";
const ADMIN_CONVERSATION_PATTERN = /^\/api\/admin\/conversations\/(\d+)$/;
const ADMIN_NOTIFICATIONS_PATH = "/api/admin/notifications";
const ADMIN_NOTIFICATION_PATTERN = /^\/api\/admin\/notifications\/(\d+)(?:\/(read|unread))?$/;
const ADMIN_NOTIFICATION_READ_ALL_PATH = "/api/admin/notifications/read-all";
const ADMIN_USERS_PATH = "/api/admin/users";
const ADMIN_USER_PATTERN = /^\/api\/admin\/users\/(\d+)(?:\/(overview|activate|deactivate|hq))?$/;
const ADMIN_LISTS_PATH = "/api/admin/lists";
const ADMIN_LIST_PATTERN = /^\/api\/admin\/lists\/(\d+)(?:\/(visibility))?$/;
const ADMIN_DASHBOARD_PATH = "/api/admin/dashboard";
const ADMIN_AUDIT_LOGS_PATH = "/api/admin/audit-logs";
const ADMIN_SETTINGS_PATH = "/api/admin/settings";
const ADMIN_SETTING_PATTERN = /^\/api\/admin\/settings\/([^/]+)$/;
const ADMIN_MOVIES_PATH = "/api/admin/movies";
const ADMIN_TMDB_QUALITY_PATH = "/api/admin/movies/tmdb-quality";
const ADMIN_TMDB_CANDIDATES_PATTERN = /^\/api\/admin\/movies\/(\d+)\/tmdb-candidates$/;
const ADMIN_TMDB_SYNC_PATTERN = /^\/api\/admin\/movies\/(\d+)\/tmdb-sync$/;
const ADMIN_TMDB_BATCH_PATH = "/api/admin/movies/tmdb-sync/batch";
const ADMIN_TMDB_IMPORT_PATH = "/api/admin/movies/tmdb-import";
const ADMIN_TMDB_DISCOVER_PATH = "/api/admin/movies/tmdb-import/discover";
const ADMIN_MOVIE_PATTERN = /^\/api\/admin\/movies\/(\d+)$/;
const PUBLIC_CATALOG_CACHE = "public, max-age=300, stale-while-revalidate=600";

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  if (!responseHeaders.has("Cache-Control")) responseHeaders.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function apiPath(pathname: string): string {
  if (pathname === FUNCTION_PREFIX || pathname === `${FUNCTION_PREFIX}/`) return "/";
  const apiIndex = pathname.indexOf("/api/");
  if (apiIndex >= 0) return pathname.slice(apiIndex);
  return pathname.startsWith(`${FUNCTION_PREFIX}/`)
    ? pathname.slice(FUNCTION_PREFIX.length)
    : pathname;
}

async function confirmedAuthUser(request: Request, verifier?: RewindAuthVerifier): Promise<HostedAuthUser | null> {
  const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer || !verifier) return null;
  try {
    const user = await verifier.verifyAccessToken(bearer);
    return user?.emailConfirmed ? user : null;
  } catch {
    return null;
  }
}

function repositoryFailure(error: unknown, fallback: string, headers: HeadersInit): Response {
  if (error instanceof RewindApiError && error.status >= 400 && error.status < 500) {
    return json({ message: error.message }, error.status, headers);
  }
  if (error instanceof RewindApiError && (error.status === 502 || error.status === 503)) {
    return json({ message: error.message }, error.status, headers);
  }
  return json({ message: fallback }, 500, headers);
}

export function createRewindApiHandler(
  repository: RewindApiRepository,
  allowedOrigins: readonly string[],
  authVerifier?: RewindAuthVerifier,
): (request: Request) => Promise<Response> {
  const origins = new Set(allowedOrigins);

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    if (origin && !origins.has(origin)) {
      return json({ message: "Origin is not allowed" }, 403, { Vary: "Origin" });
    }

    const corsHeaders = new Headers({
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type, X-Client-Info",
      "Access-Control-Max-Age": "600",
    });
    if (origin) corsHeaders.set("Access-Control-Allow-Origin", origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const path = apiPath(new URL(request.url).pathname);
    const query = new URL(request.url).searchParams;
    const publicUserMatch = path.match(PUBLIC_USER_PATTERN);
    const socialProfileMatch = path.match(PUBLIC_PROFILE_PATTERN);
    const socialPage = () => {
      const requestedPage = optionalInteger(query.get("page"), 0);
      const requestedSize = optionalInteger(query.get("size"), 20);
      return { page: Math.max(0, Math.min(requestedPage, 1000)), size: Math.max(1, Math.min(requestedSize, 50)) };
    };
    const adminReviewMatch = path.match(ADMIN_REVIEW_PATTERN);
    const adminCommentMatch = path.match(ADMIN_COMMENT_PATTERN);
    const dismissReviewReportMatch = path.match(ADMIN_REPORTED_REVIEW_DISMISS_PATTERN);
    if (dismissReviewReportMatch) {
      if (request.method !== "POST") {
        corsHeaders.set("Allow", "POST, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      const reportId = parseRouteId(dismissReviewReportMatch[1]);
      if (reportId === null) return json({ message: "Invalid report ID" }, 400, corsHeaders);
      if (!repository.dismissAdminReviewReport) return json({ message: "Not found" }, 404, corsHeaders);
      try {
        if (!await repository.dismissAdminReviewReport(authUser, reportId)) return json({ message: "Report not found" }, 404, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch (error) {
        return repositoryFailure(error, "Unable to dismiss review report", corsHeaders);
      }
    }
    if (path === ADMIN_REPORTED_REVIEWS_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      const page = parseAdminPage(query);
      if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
      if (!repository.getAdminReportedReviews) return json({ message: "Not found" }, 404, corsHeaders);
      try {
        return json(await repository.getAdminReportedReviews(authUser, page.page, page.size), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load reported reviews", corsHeaders);
      }
    }
    if (adminReviewMatch || adminCommentMatch) {
      const isReview = adminReviewMatch !== null;
      const match = (adminReviewMatch ?? adminCommentMatch)!;
      const rootPath = isReview ? "/api/admin/reviews" : "/api/admin/comments";
      const idText = match[1] ?? null;
      const action = match[2] ?? null;
      const allowed = idText === null ? ["GET"] : action ? ["POST"] : ["DELETE"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      const id = idText === null ? null : parseRouteId(idText);
      if (idText !== null && id === null) return json({ message: "Invalid moderation item ID" }, 400, corsHeaders);
      try {
        if (id === null) {
          if (path !== rootPath) return json({ message: "Not found" }, 404, corsHeaders);
          const page = parseAdminPage(query);
          if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
          const hidden = parseOptionalBoolean(query.get("hidden"));
          if (hidden === INVALID_QUERY) return json({ message: "Invalid hidden filter" }, 400, corsHeaders);
          if (isReview) {
            const movieId = parseOptionalLong(query.get("movieId"));
            const userId = parseOptionalLong(query.get("userId"));
            if (movieId === INVALID_QUERY || userId === INVALID_QUERY) return json({ message: "Invalid review filter" }, 400, corsHeaders);
            if (!repository.getAdminReviews) return json({ message: "Not found" }, 404, corsHeaders);
            return json(await repository.getAdminReviews(authUser, { movieId, userId, hidden }, page.page, page.size), 200, corsHeaders);
          }
          if (!repository.getAdminComments) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminComments(authUser, hidden, page.page, page.size), 200, corsHeaders);
        }
        if (action) {
          const hiddenValue = action === "hide";
          let reason: string | null = null;
          if (hiddenValue) {
            let body: unknown;
            try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
            const parsedReason = parseModerationReason(body, 255);
            if (parsedReason === false) return json({ message: "Invalid moderation reason" }, 400, corsHeaders);
            reason = parsedReason;
          }
          const result = isReview
            ? await repository.setAdminReviewHidden?.(authUser, id, hiddenValue, reason)
            : await repository.setAdminCommentHidden?.(authUser, id, hiddenValue, reason);
          if (!result) return json({ message: `${isReview ? "Review" : "Comment"} not found` }, 404, corsHeaders);
          return json(result, 200, corsHeaders);
        }
        const deleted = isReview
          ? await repository.deleteAdminReview?.(authUser, id)
          : await repository.deleteAdminComment?.(authUser, id);
        if (deleted === undefined) return json({ message: "Not found" }, 404, corsHeaders);
        if (!deleted) return json({ message: `${isReview ? "Review" : "Comment"} not found` }, 404, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch (error) {
        return repositoryFailure(error, `Unable to manage ${isReview ? "review" : "comment"}`, corsHeaders);
      }
    }
    const adminListMatch = path.match(ADMIN_LIST_PATTERN);
    if (path === ADMIN_LISTS_PATH || adminListMatch) {
      const isVisibilityRoute = adminListMatch?.[2] === "visibility";
      const allowed = adminListMatch ? (isVisibilityRoute ? ["PUT"] : ["DELETE"]) : ["GET"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (!adminListMatch) {
          const page = parseAdminPage(query, 100, 50);
          if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
          if (!repository.getAdminLists) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminLists(authUser, page.page, page.size), 200, corsHeaders);
        }
        const id = parseRouteId(adminListMatch[1]);
        if (id === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
        if (isVisibilityRoute) {
          const visible = parseOptionalBoolean(query.get("visible"));
          if (visible === null || visible === INVALID_QUERY) return json({ message: "Invalid visibility" }, 400, corsHeaders);
          if (!repository.setAdminListVisibility) return json({ message: "Not found" }, 404, corsHeaders);
          const result = await repository.setAdminListVisibility(authUser, id, visible);
          return result ? json(result, 200, corsHeaders) : json({ message: "List not found" }, 404, corsHeaders);
        }
        if (!repository.deleteAdminList) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.deleteAdminList(authUser, id);
        if (result === "NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
        if (result === "SYSTEM_LIST") return json({ message: "System lists cannot be deleted" }, 400, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch (error) {
        return repositoryFailure(error, "Unable to manage list", corsHeaders);
      }
    }
    const tmdbCandidatesMatch = path.match(ADMIN_TMDB_CANDIDATES_PATTERN);
    if (tmdbCandidatesMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      const movieId = parseRouteId(tmdbCandidatesMatch[1]);
      if (movieId === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
      try {
        if (!repository.searchAdminMovieTmdbCandidates) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.searchAdminMovieTmdbCandidates(authUser, movieId), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to search TMDB candidates", corsHeaders);
      }
    }
    const tmdbSyncMatch = path.match(ADMIN_TMDB_SYNC_PATTERN);
    if (tmdbSyncMatch || path === ADMIN_TMDB_BATCH_PATH || path === ADMIN_TMDB_IMPORT_PATH || path === ADMIN_TMDB_DISCOVER_PATH) {
      if (request.method !== "POST") {
        corsHeaders.set("Allow", "POST, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      let raw: unknown;
      try { raw = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json({ message: "Invalid request body" }, 400, corsHeaders);
      const body = raw as Record<string, unknown>;
      const syncSimilar = body.syncSimilar === undefined ? true : body.syncSimilar;
      if (typeof syncSimilar !== "boolean") return json({ message: "Invalid syncSimilar value" }, 400, corsHeaders);
      try {
        if (tmdbSyncMatch) {
          const movieId = parseRouteId(tmdbSyncMatch[1]);
          const tmdbId = parsePositiveId(body.tmdbId);
          if (movieId === null || tmdbId === null) return json({ message: "Invalid movie or TMDB ID" }, 400, corsHeaders);
          if (!repository.syncAdminTmdbMovie) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.syncAdminTmdbMovie(authUser, { movieId, tmdbId, syncSimilar }), 200, corsHeaders);
        }
        if (path === ADMIN_TMDB_BATCH_PATH) {
          if (!Array.isArray(body.movies) || body.movies.length < 1 || body.movies.length > 20) return json({ message: "Invalid movies" }, 400, corsHeaders);
          const inputs: AdminTmdbSyncInput[] = [];
          for (const item of body.movies) {
            if (!item || typeof item !== "object" || Array.isArray(item)) return json({ message: "Invalid movies" }, 400, corsHeaders);
            const row = item as Record<string, unknown>, movieId = parsePositiveId(row.movieId), tmdbId = parsePositiveId(row.tmdbId);
            if (movieId === null || tmdbId === null) return json({ message: "Invalid movies" }, 400, corsHeaders);
            inputs.push({ movieId, tmdbId, syncSimilar });
          }
          if (!repository.syncAdminTmdbBatch) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.syncAdminTmdbBatch(authUser, inputs, syncSimilar), 200, corsHeaders);
        }
        if (path === ADMIN_TMDB_IMPORT_PATH) {
          if (!Array.isArray(body.tmdbIds) || body.tmdbIds.length < 1 || body.tmdbIds.length > 20) return json({ message: "Invalid TMDB IDs" }, 400, corsHeaders);
          const ids = body.tmdbIds.map(parsePositiveId);
          if (ids.some((id) => id === null) || new Set(ids).size !== ids.length) return json({ message: "Invalid or duplicate TMDB IDs" }, 400, corsHeaders);
          if (!repository.importAdminTmdb) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.importAdminTmdb(authUser, ids as number[], syncSimilar), 200, corsHeaders);
        }
        const page = body.page, year = body.year, genreId = body.genreId, minRating = body.minRating, limit = body.limit;
        if (!Number.isInteger(page) || (page as number) < 1 || (page as number) > 500
          || (year !== undefined && year !== null && (!Number.isInteger(year) || (year as number) < 1888 || (year as number) > 2100))
          || (genreId !== undefined && genreId !== null && parsePositiveId(genreId) === null)
          || (minRating !== undefined && minRating !== null && (typeof minRating !== "number" || !Number.isFinite(minRating) || minRating < 0 || minRating > 10))
          || !Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 20) {
          return json({ message: "Invalid TMDB discovery request" }, 400, corsHeaders);
        }
        if (!repository.discoverAndImportAdminTmdb) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.discoverAndImportAdminTmdb(authUser, {
          page: page as number, year: year == null ? null : year as number, genreId: genreId == null ? null : genreId as number,
          minRating: minRating == null ? null : minRating as number, limit: limit as number, syncSimilar,
        }), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to synchronize TMDB catalog", corsHeaders);
      }
    }
    if (path === ADMIN_TMDB_QUALITY_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (!repository.getAdminTmdbQuality) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminTmdbQuality(authUser), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load TMDB catalog quality", corsHeaders);
      }
    }
    const adminMovieMatch = path.match(ADMIN_MOVIE_PATTERN);
    if (path === ADMIN_MOVIES_PATH || adminMovieMatch) {
      const allowed = !adminMovieMatch ? ["GET", "POST"] : ["PUT", "DELETE"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (!adminMovieMatch && request.method === "GET") {
          const page = parseAdminPage(query, 100, 50);
          if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
          const search = query.get("q")?.trim() || null;
          if (search !== null && search.length > 120) return json({ message: "Movie search is too long" }, 400, corsHeaders);
          if (!repository.getAdminMovies) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminMovies(authUser, search, page.page, page.size), 200, corsHeaders);
        }
        if (!adminMovieMatch && request.method === "POST") {
          let body: unknown;
          try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const parsed = parseAdminMovieWrite(body, true);
          if (!parsed) return json({ message: "Invalid movie" }, 400, corsHeaders);
          if (!repository.createAdminMovie) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.createAdminMovie(authUser, parsed), 200, corsHeaders);
        }
        const id = parseRouteId(adminMovieMatch![1]);
        if (id === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
        if (request.method === "DELETE") {
          if (!repository.deleteAdminMovie) return json({ message: "Not found" }, 404, corsHeaders);
          return await repository.deleteAdminMovie(authUser, id)
            ? new Response(null, { status: 204, headers: corsHeaders })
            : json({ message: "Movie not found" }, 404, corsHeaders);
        }
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const parsed = parseAdminMovieWrite(body, false);
        if (!parsed) return json({ message: "Invalid movie" }, 400, corsHeaders);
        if (!repository.updateAdminMovie) return json({ message: "Not found" }, 404, corsHeaders);
        const updated = await repository.updateAdminMovie(authUser, id, parsed);
        return updated ? json(updated, 200, corsHeaders) : json({ message: "Movie not found" }, 404, corsHeaders);
      } catch (error) {
        console.error("Admin movie catalog operation failed", error);
        return repositoryFailure(error, "Unable to manage movie catalog", corsHeaders);
      }
    }
    const adminSettingMatch = path.match(ADMIN_SETTING_PATTERN);
    if (path === ADMIN_DASHBOARD_PATH || path === ADMIN_AUDIT_LOGS_PATH || path === ADMIN_SETTINGS_PATH || adminSettingMatch) {
      const allowed = path === ADMIN_DASHBOARD_PATH ? ["GET"]
        : path === ADMIN_AUDIT_LOGS_PATH ? ["GET"]
        : path === ADMIN_SETTINGS_PATH ? ["GET"] : ["PUT"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (path === ADMIN_DASHBOARD_PATH) {
          if (!repository.getAdminDashboard) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminDashboard(authUser), 200, corsHeaders);
        }
        if (path === ADMIN_AUDIT_LOGS_PATH) {
          const page = parseAdminPage(query, 100, 50);
          if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
          if (!repository.getAdminAuditLogs) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminAuditLogs(authUser, page.page, page.size), 200, corsHeaders);
        }
        if (path === ADMIN_SETTINGS_PATH) {
          if (!repository.getAdminSettings) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminSettings(authUser), 200, corsHeaders);
        }
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const value = body && typeof body === "object" && !Array.isArray(body) ? (body as { value?: unknown }).value : undefined;
        if (typeof value !== "string" || value.trim().length < 1 || value.length > 255) return json({ message: "Invalid setting value" }, 400, corsHeaders);
        let key: string;
        try { key = decodeURIComponent(adminSettingMatch![1]); } catch { return json({ message: "Invalid setting key" }, 400, corsHeaders); }
        const allowedKeys = new Set(["site_name", "default_locale", "maintenance_mode", "journal_enabled"]);
        const normalized = value.trim();
        if (!allowedKeys.has(key)
          || ((key === "maintenance_mode" || key === "journal_enabled") && !/^(true|false)$/i.test(normalized))
          || (key === "default_locale" && !/^(uk|en)$/i.test(normalized))) return json({ message: "Invalid setting" }, 400, corsHeaders);
        if (!repository.updateAdminSetting) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.updateAdminSetting(authUser, key, normalized);
        return result ? json(result, 200, corsHeaders) : json({ message: "Site setting not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to manage site settings", corsHeaders);
      }
    }
    const adminUserMatch = path.match(ADMIN_USER_PATTERN);
    if (path === ADMIN_USERS_PATH || adminUserMatch) {
      const idText = adminUserMatch?.[1] ?? null;
      const action = adminUserMatch?.[2] ?? null;
      const allowed = idText === null ? ["GET"] : action === "activate" || action === "deactivate" ? ["POST"]
        : action === "hq" ? ["PUT"] : action === "overview" ? ["GET"] : ["GET", "PATCH"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      const id = idText === null ? null : parseRouteId(idText);
      if (idText !== null && id === null) return json({ message: "Invalid user ID" }, 400, corsHeaders);
      try {
        if (id === null) {
          const page = parseAdminPage(query, 50, 20);
          if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
          const search = query.get("q")?.trim() || null;
          if (search !== null && search.length > 1000) return json({ message: "Search query is too long" }, 400, corsHeaders);
          if (!repository.getAdminUsers) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminUsers(authUser, search, page.page, page.size), 200, corsHeaders);
        }
        if (action === "overview") {
          if (!repository.getAdminUserOverview) return json({ message: "Not found" }, 404, corsHeaders);
          const result = await repository.getAdminUserOverview(authUser, id);
          return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
        }
        if (action === "activate" || action === "deactivate") {
          if (!repository.setAdminUserActive) return json({ message: "Not found" }, 404, corsHeaders);
          if (!await repository.setAdminUserActive(authUser, id, action === "activate")) return json({ message: "User not found" }, 404, corsHeaders);
          return new Response(null, { status: 200, headers: corsHeaders });
        }
        if (action === "hq") {
          let body: unknown;
          try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { hq?: unknown }).hq !== "boolean") {
            return json({ message: "Invalid HQ request" }, 400, corsHeaders);
          }
          if (!repository.setAdminUserHq) return json({ message: "Not found" }, 404, corsHeaders);
          const result = await repository.setAdminUserHq(authUser, id, (body as { hq: boolean }).hq);
          return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
        }
        if (request.method === "PATCH") {
          let body: unknown;
          try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const update = parseAdminUserUpdate(body);
          if (!update) return json({ message: "Invalid user update" }, 400, corsHeaders);
          if (!repository.updateAdminUser) return json({ message: "Not found" }, 404, corsHeaders);
          const result = await repository.updateAdminUser(authUser, id, update);
          return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
        }
        if (!repository.getAdminUser) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.getAdminUser(authUser, id);
        return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to manage user", corsHeaders);
      }
    }
    if (path === ADMIN_MODERATION_QUEUE_PATH || path === ADMIN_MODERATION_BULK_PATH || path.match(ADMIN_MODERATION_HIDE_PATTERN)) {
      const hideMatch = path.match(ADMIN_MODERATION_HIDE_PATTERN);
      const allowed = path === ADMIN_MODERATION_QUEUE_PATH ? ["GET"] : ["POST"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (path === ADMIN_MODERATION_QUEUE_PATH) {
          const page = parseAdminPage(query);
          if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
          const rawType = query.get("type")?.trim();
          const type = rawType ? rawType.toUpperCase() : null;
          if (type !== null && type !== "REVIEW" && type !== "COMMENT") return json({ message: "Unsupported moderation item type" }, 400, corsHeaders);
          if (!repository.getAdminModerationQueue) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminModerationQueue(authUser, type, query.get("query"), page.page, page.size), 200, corsHeaders);
        }
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        if (path === ADMIN_MODERATION_BULK_PATH) {
          const parsed = parseBulkModeration(body);
          if (!parsed) return json({ message: "Invalid bulk moderation request" }, 400, corsHeaders);
          if (!repository.bulkHideAdminModeration) return json({ message: "Not found" }, 404, corsHeaders);
          return json({ hidden: await repository.bulkHideAdminModeration(authUser, parsed.items, parsed.reason) }, 200, corsHeaders);
        }
        const type = hideMatch![1].toUpperCase();
        const id = parseRouteId(hideMatch![2]);
        if (type !== "REVIEW" && type !== "COMMENT") return json({ message: "Unsupported moderation item type" }, 400, corsHeaders);
        if (id === null) return json({ message: "Invalid moderation item ID" }, 400, corsHeaders);
        const reason = parseModerationReason(body, 255);
        if (reason === false) return json({ message: "Invalid moderation reason" }, 400, corsHeaders);
        if (!repository.hideAdminModerationItem) return json({ message: "Not found" }, 404, corsHeaders);
        await repository.hideAdminModerationItem(authUser, type, id, reason);
        return new Response(null, { status: 200, headers: corsHeaders });
      } catch (error) {
        return repositoryFailure(error, "Unable to manage moderation queue", corsHeaders);
      }
    }
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
    const adminJournalArticleMatch = path.match(ADMIN_JOURNAL_ARTICLE_PATTERN);
    if (path === ADMIN_JOURNAL_PATH || adminJournalArticleMatch) {
      const newsletterRoute = adminJournalArticleMatch?.[2] === "newsletter";
      const allowed = path === ADMIN_JOURNAL_PATH ? ["GET", "POST"] : newsletterRoute ? ["GET", "POST"] : ["PUT"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (newsletterRoute) {
          const id = parseRouteId(adminJournalArticleMatch![1]);
          if (id === null) return json({ message: "Invalid article ID" }, 400, corsHeaders);
          if (request.method === "GET") {
            if (!repository.getAdminNewsletterStatus) return json({ message: "Not found" }, 404, corsHeaders);
            const status = await repository.getAdminNewsletterStatus(authUser, id);
            return status ? json(status, 200, corsHeaders) : json({ message: "Article not found" }, 404, corsHeaders);
          }
          if (!repository.queueAdminNewsletter) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.queueAdminNewsletter(authUser, id), 200, corsHeaders);
        }
        if (request.method === "GET") {
          if (!repository.getAdminJournalArticles) return json({ message: "Not found" }, 404, corsHeaders);
          const requestedPage = optionalInteger(query.get("page"), 0);
          let requestedSize = optionalInteger(query.get("size"), 50);
          if (requestedSize === 0) requestedSize = 50;
          return json(await repository.getAdminJournalArticles(authUser, Math.max(0, Math.min(requestedPage, 1000)), Math.max(1, Math.min(requestedSize, 100))), 200, corsHeaders);
        }
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const article = parseAdminJournalArticle(body);
        if (!article) return json({ message: "Invalid journal article" }, 400, corsHeaders);
        if (path === ADMIN_JOURNAL_PATH) {
          if (!repository.createAdminJournalArticle) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.createAdminJournalArticle(authUser, article), 200, corsHeaders);
        }
        const id = parseRouteId(adminJournalArticleMatch![1]);
        if (id === null) return json({ message: "Invalid article ID" }, 400, corsHeaders);
        if (!repository.updateAdminJournalArticle) return json({ message: "Not found" }, 404, corsHeaders);
        const updated = await repository.updateAdminJournalArticle(authUser, id, article);
        return updated ? json(updated, 200, corsHeaders) : json({ message: "Article not found" }, 404, corsHeaders);
      } catch (error) {
        console.error("Admin journal operation failed", error);
        return repositoryFailure(error, "Unable to manage journal article", corsHeaders);
      }
    }
    const journalArticleMatch = path.match(JOURNAL_ARTICLE_PATTERN);
    if (path === JOURNAL_PATH || path === JOURNAL_ARCHIVE_PATH || journalArticleMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const language = query.get("language") === "en" ? "en" : "uk";
      try {
        if (path === JOURNAL_ARCHIVE_PATH) {
          if (!repository.getJournalArchive) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getJournalArchive(language), 200, corsHeaders);
        }
        if (journalArticleMatch) {
          if (!repository.getJournalArticle) return json({ message: "Not found" }, 404, corsHeaders);
          let slug: string;
          try { slug = decodeURIComponent(journalArticleMatch[1]); } catch { return json({ message: "Invalid article slug" }, 400, corsHeaders); }
          const article = await repository.getJournalArticle(language, slug);
          return article ? json(article, 200, corsHeaders) : json({ message: "Article not found" }, 404, corsHeaders);
        }
        if (!repository.getJournal) return json({ message: "Not found" }, 404, corsHeaders);
        const rawYear = query.get("year");
        const rawMonth = query.get("month");
        const year = rawYear === null ? null : /^\d{1,4}$/.test(rawYear) ? Number(rawYear) : NaN;
        const month = rawMonth === null ? null : /^\d{1,2}$/.test(rawMonth) ? Number(rawMonth) : NaN;
        if ((rawYear !== null && !Number.isSafeInteger(year)) || (rawMonth !== null && !Number.isSafeInteger(month))
          || ((year === null) !== (month === null)) || (year !== null && (year < 1900 || year > 9999 || month! < 1 || month! > 12))) {
          return json({ message: "Invalid archive month" }, 400, corsHeaders);
        }
        const { page, size } = socialPage();
        const category = query.get("category")?.trim() || null;
        return json(await repository.getJournal(language, category, year, month, page, size), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load journal", corsHeaders);
      }
    }
    if (path === NEWSLETTER_SUBSCRIPTION_PATH) {
      if (!(["GET", "PUT"] as string[]).includes(request.method)) {
        corsHeaders.set("Allow", "GET, PUT, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (request.method === "GET") {
          if (!repository.getNewsletterSubscription) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getNewsletterSubscription(authUser), 200, corsHeaders);
        }
        if (!repository.updateNewsletterSubscription) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        if (!body || typeof body !== "object" || typeof (body as { subscribed?: unknown }).subscribed !== "boolean") {
          return json({ message: "Invalid subscription preference" }, 400, corsHeaders);
        }
        return json(await repository.updateNewsletterSubscription(authUser, (body as { subscribed: boolean }).subscribed), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to update newsletter subscription", corsHeaders);
      }
    }
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
        const { page, size } = socialPage();
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
          const { page, size } = socialPage();
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
          const { page, size } = socialPage();
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
    if (path === HQ_USERS_PATH || path === USER_DIRECTORY_PATH || path === POPULAR_REVIEWERS_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const { page, size } = socialPage();
      try {
        if (path === POPULAR_REVIEWERS_PATH) {
          if (!repository.getPopularReviewers) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getPopularReviewers(Math.min(size, 20)), 200, corsHeaders);
        }
        const result = path === HQ_USERS_PATH
          ? await repository.getHqUsers?.(page, size)
          : await repository.getDirectoryUsers?.(query.get("q")?.trim() || null, page, size);
        if (!result) return json({ message: "Not found" }, 404, corsHeaders);
        return json(result, 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load users", corsHeaders);
      }
    }
    if (path === FOLLOWING_ACTIVITY_PATH || path === RECENT_WATCHED_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const { page, size } = socialPage();
      try {
        if (path === RECENT_WATCHED_PATH) {
          if (!repository.getRecentWatched) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getRecentWatched(size), 200, corsHeaders);
        }
        const authUser = await confirmedAuthUser(request, authVerifier);
        if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (!repository.getFollowingActivity) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getFollowingActivity(authUser, page, size), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load activity", corsHeaders);
      }
    }
    if (socialProfileMatch || publicUserMatch) {
      const userId = Number((socialProfileMatch ?? publicUserMatch)![1]);
      if (!Number.isSafeInteger(userId) || userId <= 0) return json({ message: "Invalid user ID" }, 400, corsHeaders);
      const route = socialProfileMatch?.[2] ?? "user";
      const isFollowAction = route === "follow";
      const isFollowStatus = route === "follow-status";
      const isBlockAction = route === "block";
      const isBlockStatus = route === "block-status";
      const permittedMethods = isFollowAction || isBlockAction ? ["POST", "DELETE"] : ["GET"];
      if (!permittedMethods.includes(request.method)) {
        corsHeaders.set("Allow", `${permittedMethods.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      try {
        if (isFollowAction || isFollowStatus || isBlockAction || isBlockStatus) {
          const authUser = await confirmedAuthUser(request, authVerifier);
          if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
          if (isFollowStatus) {
            if (!repository.getFollowStatus) return json({ message: "Not found" }, 404, corsHeaders);
            const status = await repository.getFollowStatus(authUser, userId);
            return status ? json(status, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
          }
          if (isBlockStatus) {
            if (!repository.getBlockStatus) return json({ message: "Not found" }, 404, corsHeaders);
            const status = await repository.getBlockStatus(authUser, userId);
            return status ? json(status, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
          }
          if (isBlockAction) {
            if (!repository.setBlock) return json({ message: "Not found" }, 404, corsHeaders);
            const blocked = await repository.setBlock(authUser, userId, request.method === "POST");
            return blocked === null ? json({ message: "User not found" }, 404, corsHeaders)
              : json({ blocked: request.method === "POST" }, 200, corsHeaders);
          }
          if (!repository.setFollow) return json({ message: "Not found" }, 404, corsHeaders);
          const ok = await repository.setFollow(authUser, userId, request.method === "POST");
          if (!ok) return json({ message: "User not found" }, 404, corsHeaders);
          return new Response(null, { status: 204, headers: corsHeaders });
        }
        if (route === "profile") {
          if (!repository.getPublicProfile) return json({ message: "Not found" }, 404, corsHeaders);
          const result = await repository.getPublicProfile(userId);
          return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
        }
        const { page, size } = socialPage();
        let result: unknown = null;
        if (route === "followers") result = await repository.getFollowers?.(userId, page, size);
        else if (route === "following") result = await repository.getFollowing?.(userId, page, size);
        else if (route === "activity") result = await repository.getUserActivity?.(userId, page, size);
        else if (route === "lists") result = await repository.getPublicProfileLists?.(userId, page, size);
        else if (route === "liked-reviews") result = await repository.getPublicProfileLikedReviews?.(userId, page, size);
        else if (route.startsWith("collections/")) {
          result = await repository.getPublicProfileCollection?.(userId, socialProfileMatch![3] as "watched" | "watchlist" | "favorites", page, size);
        } else result = await repository.getPublicUser?.(userId);
        if (result === null || result === undefined) return json({ message: "User not found" }, 404, corsHeaders);
        return json(result, 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load social profile", corsHeaders);
      }
    }
    if (path === POPULAR_TAGS_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (!repository.getPopularTags) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const rawSize = query.get("size");
      const requestedSize = rawSize === null ? 20 : optionalInteger(rawSize, -2147483649);
      if (requestedSize < -2147483648 || requestedSize > 2147483647) return json({ message: "Invalid size" }, 400, corsHeaders);
      try {
        const tags = await repository.getPopularTags(Math.max(1, Math.min(requestedSize, 30)));
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(tags, 200, corsHeaders);
      } catch {
        return json({ message: "Unable to load tags" }, 500, corsHeaders);
      }
    }
    const publicListFeedMatch = path.match(PUBLIC_LIST_FEED_PATTERN);
    if (publicListFeedMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (!repository.getPublicLists) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const rawPage = query.get("page");
      const requestedPage = rawPage === null ? 0 : optionalInteger(rawPage, -2147483649);
      const rawSize = query.get("size");
      const requestedSize = rawSize === null ? 20 : optionalInteger(rawSize, -2147483649);
      if (requestedPage < -2147483648 || requestedPage > 2147483647
        || requestedSize < -2147483648 || requestedSize > 2147483647) {
        return json({ message: "Invalid page or size" }, 400, corsHeaders);
      }
      const page = Math.max(0, requestedPage);
      const size = Math.max(1, Math.min(requestedSize, 50));
      const feed = (publicListFeedMatch[1] ?? "all") as "all" | "popular" | "recently-liked" | "team";
      const tag = feed === "all" ? query.get("tag")?.trim().toLowerCase() || null : null;
      if (tag && tag.length > 60) return json({ message: "Invalid tag" }, 400, corsHeaders);
      try {
        const result = await repository.getPublicLists(feed, tag, page, size);
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(result, 200, corsHeaders);
      } catch {
        return json({ message: "Unable to load public lists" }, 500, corsHeaders);
      }
    }
    const publicListDetailsMatch = path.match(PUBLIC_LIST_DETAILS_PATTERN);
    if (publicListDetailsMatch) {
      const listId = Number(publicListDetailsMatch[1]);
      if (!Number.isSafeInteger(listId) || listId <= 0) return json({ message: "Invalid list ID" }, 400, corsHeaders);
      const isLikeStatus = publicListDetailsMatch[2] === "like-status";
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (isLikeStatus) {
        const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
        if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
        try {
          const authUser = await authVerifier.verifyAccessToken(bearer);
          if (!authUser?.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
          if (!repository.getPublicListLikeStatus) return json({ message: "Not found" }, 404, corsHeaders);
          const result = await repository.getPublicListLikeStatus(authUser, listId);
          return result ? json(result, 200, corsHeaders) : json({ message: "Public list not found" }, 404, corsHeaders);
        } catch {
          return json({ message: "Unable to load list like status" }, 500, corsHeaders);
        }
      }
      if (!repository.getPublicList) return json({ message: "Not found" }, 404, corsHeaders);
      try {
        const result = await repository.getPublicList(listId);
        if (!result) return json({ message: "Public list not found" }, 404, corsHeaders);
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(result, 200, corsHeaders);
      } catch {
        return json({ message: "Unable to load public list" }, 500, corsHeaders);
      }
    }
    const publicListLikeMatch = path.match(PUBLIC_LIST_LIKE_PATTERN);
    if (publicListLikeMatch) {
      const listId = Number(publicListLikeMatch[1]);
      if (!Number.isSafeInteger(listId) || listId <= 0) return json({ message: "Invalid list ID" }, 400, corsHeaders);
      if (request.method !== "POST" && request.method !== "DELETE") {
        corsHeaders.set("Allow", "POST, DELETE, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (!authUser?.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (request.method === "POST") {
          if (!repository.likePublicList) return json({ message: "Not found" }, 404, corsHeaders);
          if (!await repository.likePublicList(authUser, listId)) return json({ message: "Public list not found" }, 404, corsHeaders);
        } else {
          if (!repository.unlikePublicList) return json({ message: "Not found" }, 404, corsHeaders);
          if (!await repository.unlikePublicList(authUser, listId)) return json({ message: "Public list not found" }, 404, corsHeaders);
        }
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch {
        return json({ message: "Unable to update list like" }, 500, corsHeaders);
      }
    }
    const listIdMatch = path.match(LIST_ID_PATTERN);
    const listItemsMatch = path.match(LIST_ITEMS_PATTERN);
    const listReorderMatch = path.match(LIST_REORDER_PATTERN);
    const listAddMovieMatch = path.match(LIST_ADD_MOVIE_PATTERN);
    const listRemoveMovieMatch = path.match(LIST_REMOVE_MOVIE_PATTERN);
    const isMyListsRoute = path === MY_LISTS_PATH || path === MY_LISTS_PAGE_PATH;
    const isCreateListRoute = path === "/api/lists";
    if (isMyListsRoute || isCreateListRoute || listIdMatch || listItemsMatch || listReorderMatch || listAddMovieMatch || listRemoveMovieMatch) {
      const method = request.method;
      const allowed = isMyListsRoute ? ["GET"]
        : isCreateListRoute ? ["POST"]
        : listIdMatch ? ["PATCH", "DELETE"]
        : listReorderMatch ? ["PUT"]
        : listItemsMatch ? ["GET"]
        : listAddMovieMatch ? ["POST"]
        : ["DELETE"];
      if (!allowed.includes(method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      try {
        const authUser = await confirmedAuthUser(request, authVerifier);
        if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);

        if (isMyListsRoute) {
          if (path === MY_LISTS_PATH) {
            if (!repository.getMyLists) return json({ message: "Not found" }, 404, corsHeaders);
            return json(await repository.getMyLists(authUser), 200, corsHeaders);
          }
          if (!repository.getMyListsPage) return json({ message: "Not found" }, 404, corsHeaders);
          const query = new URL(request.url).searchParams;
          const rawPage = query.get("page");
          const rawSize = query.get("size");
          const requestedPage = rawPage === null ? 0 : optionalInteger(rawPage, -2147483649);
          const requestedSize = rawSize === null ? 12 : optionalInteger(rawSize, -2147483649);
          if (requestedPage < -2147483648 || requestedPage > 2147483647
            || requestedSize < -2147483648 || requestedSize > 2147483647) {
            return json({ message: "Invalid page or size" }, 400, corsHeaders);
          }
          return json(await repository.getMyListsPage(authUser, Math.max(0, requestedPage),
            Math.max(1, Math.min(requestedSize, 50))), 200, corsHeaders);
        }

        if (isCreateListRoute) {
          if (!repository.createMyList) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const body = parseCreateMyList(value);
          if (!body) return json({ message: "Invalid list details" }, 400, corsHeaders);
          return json(await repository.createMyList(authUser, body), 200, corsHeaders);
        }

        if (listIdMatch) {
          const listId = parseRouteId(listIdMatch[1]);
          if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
          if (method === "PATCH") {
            if (!repository.updateMyList) return json({ message: "Not found" }, 404, corsHeaders);
            let value: unknown;
            try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
            const body = parseUpdateMyList(value);
            if (!body) return json({ message: "Invalid list details" }, 400, corsHeaders);
            const updated = await repository.updateMyList(authUser, listId, body);
            return updated ? json(updated, 200, corsHeaders) : json({ message: "List not found" }, 404, corsHeaders);
          }
          if (!repository.deleteMyList) return json({ message: "Not found" }, 404, corsHeaders);
          const deleted = await repository.deleteMyList(authUser, listId);
          return deleted ? new Response(null, { status: 204, headers: corsHeaders })
            : json({ message: "List not found" }, 404, corsHeaders);
        }

        if (listReorderMatch) {
          const listId = parseRouteId(listReorderMatch[1]);
          if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
          if (!repository.reorderMyListItems) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const orderedItemIds = parseOrderedItemIds(value);
          if (!orderedItemIds) return json({ message: "Invalid list item order" }, 400, corsHeaders);
          const result = await repository.reorderMyListItems(authUser, listId, orderedItemIds);
          if (result === "LIST_NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
          if (result === "INVALID_ORDER") return json({ message: "Invalid list item order" }, 400, corsHeaders);
          return new Response(null, { status: 200, headers: corsHeaders });
        }

        if (listItemsMatch) {
          const listId = parseRouteId(listItemsMatch[1]);
          if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
          if (!repository.getMyListItems) return json({ message: "Not found" }, 404, corsHeaders);
          const items = await repository.getMyListItems(authUser, listId);
          return items ? json(items, 200, corsHeaders) : json({ message: "List not found" }, 404, corsHeaders);
        }

        if (listAddMovieMatch) {
          const listId = parseRouteId(listAddMovieMatch[1]);
          if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
          if (!repository.addMovieToMyList) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const body = parseAddListMovie(value);
          if (!body) return json({ message: "Invalid movie details" }, 400, corsHeaders);
          const result = await repository.addMovieToMyList(authUser, listId, body.movieId, body.position);
          if (result === "LIST_NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
          if (result === "MOVIE_NOT_FOUND") return json({ message: "Movie not found" }, 400, corsHeaders);
          return new Response(null, { status: 200, headers: corsHeaders });
        }

        const listId = parseRouteId(listRemoveMovieMatch![1]);
        const movieId = parseRouteId(listRemoveMovieMatch![2]);
        if (listId === null || movieId === null) return json({ message: "Invalid list or movie ID" }, 400, corsHeaders);
        if (!repository.removeMovieFromMyList) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.removeMovieFromMyList(authUser, listId, movieId);
        if (result === "LIST_NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
        if (result === "LAST_MOVIE") return json({ message: "A custom list must contain at least one movie" }, 400, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch (error) {
        return repositoryFailure(error, "Unable to update lists", corsHeaders);
      }
    }
    const reviewFeedMatch = path.match(PUBLIC_REVIEW_FEED_PATTERN);
    if (reviewFeedMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (!repository.getPublicReviewFeed) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const page = Math.max(0, optionalInteger(query.get("page"), 0));
      const requestedSize = optionalInteger(query.get("size"), 6);
      const size = Math.max(1, Math.min(requestedSize, 20));
      try {
        return json(await repository.getPublicReviewFeed(reviewFeedMatch[1] as "recent" | "popular", page, size), 200, corsHeaders);
      } catch {
        return json({ message: "Unable to load reviews" }, 500, corsHeaders);
      }
    }
    const movieReviewsMatch = path.match(MOVIE_REVIEWS_PATTERN);
    if (movieReviewsMatch) {
      const movieId = parseRouteId(movieReviewsMatch[1]);
      if (movieId === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
      const isMine = movieReviewsMatch[2] === "me";
      const allowed = isMine ? ["GET"] : ["GET", "POST"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (isMine || request.method === "POST") {
        const authUser = await confirmedAuthUser(request, authVerifier);
        if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
        try {
          if (isMine) {
            if (!repository.getMyMovieReview) return json({ message: "Not found" }, 404, corsHeaders);
            const review = await repository.getMyMovieReview(authUser, movieId);
            return review ? json(review, 200, corsHeaders) : new Response(null, { status: 204, headers: corsHeaders });
          }
          if (!repository.createReview) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const body = parseCreateReview(value);
          if (!body) return json({ message: "Invalid review details" }, 400, corsHeaders);
          return json(await repository.createReview(authUser, movieId, body.content, body.rating), 200, corsHeaders);
        } catch (error) {
          return repositoryFailure(error, "Unable to update review", corsHeaders);
        }
      }
      if (!repository.getMovieReviews) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const page = Math.max(0, optionalInteger(query.get("page"), 0));
      const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 10), 50));
      try {
        return json(await repository.getMovieReviews(movieId, page, size), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load reviews", corsHeaders);
      }
    }
    const reviewDetailsMatch = path.match(REVIEW_DETAILS_PATTERN);
    const reviewReportMatch = path.match(REVIEW_REPORT_PATTERN);
    if (reviewReportMatch) {
      const reviewId = parseRouteId(reviewReportMatch[1]);
      if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
      if (request.method !== "GET" && request.method !== "POST") {
        corsHeaders.set("Allow", "GET, POST, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (request.method === "GET") {
          if (!repository.getMyReviewReport) return json({ message: "Not found" }, 404, corsHeaders);
          const status = await repository.getMyReviewReport(authUser, reviewId);
          return status ? json(status, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
        }
        if (!repository.reportReview) return json({ message: "Not found" }, 404, corsHeaders);
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const reason = parseReviewReportReason(value);
        if (!reason) return json({ message: "Invalid report reason" }, 400, corsHeaders);
        const report = await repository.reportReview(authUser, reviewId, reason);
        return report ? json(report, 200, corsHeaders) : json({ message: "Review cannot be reported" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to submit review report", corsHeaders);
      }
    }
    if (reviewDetailsMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, PATCH, DELETE, OPTIONS");
        if (request.method !== "PATCH" && request.method !== "DELETE") return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const reviewId = parseRouteId(reviewDetailsMatch[1]);
      if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
      if (request.method === "GET") {
        if (!repository.getReviewDetails) return json({ message: "Not found" }, 404, corsHeaders);
        try {
          const details = await repository.getReviewDetails(reviewId);
          return details ? json(details, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
        } catch (error) {
          return repositoryFailure(error, "Unable to load review", corsHeaders);
        }
      }
      if (request.method !== "PATCH" && request.method !== "DELETE") return json({ message: "Method not allowed" }, 405, corsHeaders);
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (request.method === "PATCH") {
          if (!repository.updateMyReview) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const update = parseReviewUpdate(value);
          if (!update) return json({ message: "Invalid review details" }, 400, corsHeaders);
          const review = await repository.updateMyReview(authUser, reviewId, update);
          return review ? json(review, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
        }
        if (!repository.deleteMyReview) return json({ message: "Not found" }, 404, corsHeaders);
        return await repository.deleteMyReview(authUser, reviewId)
          ? new Response(null, { status: 204, headers: corsHeaders })
          : json({ message: "Review not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to update review", corsHeaders);
      }
    }
    const reviewCommentsMatch = path.match(REVIEW_COMMENTS_PATTERN);
    if (reviewCommentsMatch) {
      const reviewId = parseRouteId(reviewCommentsMatch[1]);
      if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
      if (request.method !== "GET" && request.method !== "POST") {
        corsHeaders.set("Allow", "GET, POST, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (request.method === "GET") {
        if (!repository.getReviewComments) return json({ message: "Not found" }, 404, corsHeaders);
        const query = new URL(request.url).searchParams;
        const page = Math.max(0, optionalInteger(query.get("page"), 0));
        const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));
        try {
          return json(await repository.getReviewComments(reviewId, page, size), 200, corsHeaders);
        } catch (error) {
          return repositoryFailure(error, "Unable to load comments", corsHeaders);
        }
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (!repository.createReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
      let value: unknown;
      try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const text = parseCommentText(value);
      if (text === null) return json({ message: "Invalid comment details" }, 400, corsHeaders);
      try {
        const comment = await repository.createReviewComment(authUser, reviewId, text);
        return comment ? json(comment, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to create comment", corsHeaders);
      }
    }
    const commentMatch = path.match(COMMENT_PATTERN);
    if (commentMatch) {
      const commentId = parseRouteId(commentMatch[1]);
      if (commentId === null) return json({ message: "Invalid comment ID" }, 400, corsHeaders);
      if (request.method !== "PATCH" && request.method !== "DELETE") {
        corsHeaders.set("Allow", "PATCH, DELETE, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (request.method === "PATCH") {
          if (!repository.updateReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const text = parseCommentText(value);
          if (text === null) return json({ message: "Invalid comment details" }, 400, corsHeaders);
          const comment = await repository.updateReviewComment(authUser, commentId, text);
          if (comment === "FORBIDDEN") return json({ message: "You cannot change this comment" }, 403, corsHeaders);
          return comment ? json(comment, 200, corsHeaders) : json({ message: "Comment not found" }, 404, corsHeaders);
        }
        if (!repository.deleteReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.deleteReviewComment(authUser, commentId);
        if (result === "FORBIDDEN") return json({ message: "You cannot change this comment" }, 403, corsHeaders);
        return result === "OK" ? new Response(null, { status: 204, headers: corsHeaders })
          : json({ message: "Comment not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to update comment", corsHeaders);
      }
    }
    const reviewLikesMatch = path.match(REVIEW_LIKES_PATTERN);
    if (reviewLikesMatch) {
      const reviewId = parseRouteId(reviewLikesMatch[1]);
      if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
      const isStatus = reviewLikesMatch[2] === "like-status";
      const allowed = isStatus ? ["GET"] : ["GET", "POST", "DELETE"];
      if (!allowed.includes(request.method)) {
        corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (request.method === "GET" && !isStatus) {
        if (!repository.getReviewLikes) return json({ message: "Not found" }, 404, corsHeaders);
        try {
          const likes = await repository.getReviewLikes(reviewId);
          return likes === null ? json({ message: "Review not found" }, 404, corsHeaders) : json(likes, 200, corsHeaders);
        } catch (error) {
          return repositoryFailure(error, "Unable to load likes", corsHeaders);
        }
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (isStatus) {
          if (!repository.getReviewLikeStatus) return json({ message: "Not found" }, 404, corsHeaders);
          const status = await repository.getReviewLikeStatus(authUser, reviewId);
          return status ? json(status, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
        }
        const action = request.method === "POST" ? repository.likeReview : repository.unlikeReview;
        if (!action) return json({ message: "Not found" }, 404, corsHeaders);
        const exists = await action(authUser, reviewId);
        return exists ? new Response(null, { status: 204, headers: corsHeaders })
          : json({ message: "Review not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to update review like", corsHeaders);
      }
    }
    if (path === MY_SOCIAL_LINKS_PATH) {
      if (request.method !== "GET" && request.method !== "PUT") {
        corsHeaders.set("Allow", "GET, PUT, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (request.method === "GET") {
          if (!repository.getMySocialLinks) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getMySocialLinks(authUser), 200, corsHeaders);
        }
        if (!repository.updateMySocialLinks) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        if (!Array.isArray(body) || body.length > 8) return json({ message: "Invalid social links" }, 400, corsHeaders);
        const links: SocialLinkResponse[] = [];
        const platforms = new Set<string>();
        for (const value of body) {
          if (!value || typeof value !== "object") return json({ message: "Invalid social links" }, 400, corsHeaders);
          const platform = (value as { platform?: unknown }).platform;
          const url = (value as { url?: unknown }).url;
          if (typeof platform !== "string" || typeof url !== "string") return json({ message: "Invalid social links" }, 400, corsHeaders);
          const normalizedPlatform = platform.trim().toLowerCase();
          const normalizedUrl = url.trim();
          if (!normalizedPlatform || normalizedPlatform.length > 30 || !["website", "instagram", "tiktok", "letterboxd"].includes(normalizedPlatform)
            || platforms.has(normalizedPlatform) || normalizedUrl.length > 255 || !/^https?:\/\/\S+$/i.test(normalizedUrl)) {
            return json({ message: "Invalid social links" }, 400, corsHeaders);
          }
          platforms.add(normalizedPlatform);
          links.push({ platform: normalizedPlatform, url: normalizedUrl });
        }
        return json(await repository.updateMySocialLinks(authUser, links), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to update social links", corsHeaders);
      }
    }
    if (path === MY_PROFILE_PASSWORD_PATH) {
      if (request.method !== "PUT") {
        corsHeaders.set("Allow", "PUT, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
      const authUser = await authVerifier.verifyAccessToken(bearer);
      if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (!authVerifier.changePassword) return json({ message: "Not found" }, 404, corsHeaders);
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const currentPassword = body && typeof body === "object" ? (body as Record<string, unknown>).currentPassword : null;
      const newPassword = body && typeof body === "object" ? (body as Record<string, unknown>).newPassword : null;
      if (typeof currentPassword !== "string" || !currentPassword.trim()
        || typeof newPassword !== "string" || newPassword.trim().length === 0
        || newPassword.length < 8 || newPassword.length > 72
        || new TextEncoder().encode(newPassword).length > 72) {
        return json({ message: "Invalid password" }, 400, corsHeaders);
      }
      try {
        await authVerifier.changePassword(authUser, currentPassword, newPassword);
        return json("Password changed", 200, corsHeaders);
      } catch (error) {
        if (error instanceof RewindApiError && error.status >= 400 && error.status < 500) {
          return json({ message: error.message }, error.status, corsHeaders);
        }
        return json({ message: "Authentication service is temporarily unavailable" }, 503, corsHeaders);
      }
    }
    const profileCollectionMatch = path.match(MY_PROFILE_COLLECTION_PATTERN);
    if (path === MY_PROFILE_PATH || profileCollectionMatch) {
      const isProfileUpdate = path === MY_PROFILE_PATH && request.method === "PATCH";
      const isAccountDelete = path === MY_PROFILE_PATH && request.method === "DELETE";
      if (request.method !== "GET" && !isProfileUpdate && !isAccountDelete) {
        corsHeaders.set("Allow", path === MY_PROFILE_PATH ? "GET, PATCH, DELETE, OPTIONS" : "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (path === MY_PROFILE_PATH) {
          if (isAccountDelete) {
            if (!repository.deleteMyAccount || !authVerifier.verifyCurrentPassword) return json({ message: "Not found" }, 404, corsHeaders);
            let body: unknown;
            try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
            const currentPassword = body && typeof body === "object" ? (body as Record<string, unknown>).currentPassword : null;
            if (typeof currentPassword !== "string" || !currentPassword.trim()) return json({ message: "Current password is required" }, 400, corsHeaders);
            try {
              await authVerifier.verifyCurrentPassword(authUser, currentPassword);
              const deleted = await repository.deleteMyAccount(authUser);
              if (!deleted) return json({ message: "The REWIND profile is unavailable" }, 409, corsHeaders);
              // Profile deletion is already committed with an outbox record, so provider cleanup
              // failure is retried asynchronously and must not reverse the completed deletion.
              try { await authVerifier.processPendingIdentityDeletion?.(); } catch { /* durable outbox retry */ }
              return new Response(null, { status: 204, headers: corsHeaders });
            } catch (error) {
              if (error instanceof RewindApiError && error.status >= 400 && error.status < 500) {
                return json({ message: error.message }, error.status, corsHeaders);
              }
              return json({ message: "Unable to delete account" }, 503, corsHeaders);
            }
          }
          if (!repository.getMyProfile) return json({ message: "Not found" }, 404, corsHeaders);
          if (isProfileUpdate) {
            if (!repository.updateMyProfile) return json({ message: "Not found" }, 404, corsHeaders);
            let body: unknown;
            try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
            const update = parseProfileUpdate(body);
            if (!update) return json({ message: "Invalid profile fields" }, 400, corsHeaders);
            await repository.updateMyProfile(authUser, update);
          }
          return json(await repository.getMyProfile(authUser), 200, corsHeaders);
        }
        if (!repository.getMyProfileCollection) return json({ message: "Not found" }, 404, corsHeaders);
        const query = new URL(request.url).searchParams;
        const rawPage = query.get("page");
        const page = rawPage === null ? 0 : optionalInteger(rawPage, -1);
        if (page < 0 || page > 1000) return json({ message: "Invalid page" }, 400, corsHeaders);
        const requestedSize = optionalInteger(query.get("size"), 20);
        if (requestedSize < 1) return json({ message: "Invalid page size" }, 400, corsHeaders);
        const size = Math.min(requestedSize, 50);
        return json(await repository.getMyProfileCollection(authUser, profileCollectionMatch![1], page, size), 200, corsHeaders);
      } catch {
        return json({ message: "Unable to load profile" }, 500, corsHeaders);
      }
    }
    const statusMatch = path.match(MOVIE_STATUS_PATTERN);
    const flagMatch = path.match(MOVIE_FLAG_PATTERN);
    if (statusMatch || flagMatch) {
      const movieId = Number((statusMatch ?? flagMatch)![1]);
      if (!Number.isSafeInteger(movieId) || movieId <= 0) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
      const isStatus = statusMatch !== null;
      const flag = flagMatch?.[2] as MovieFlagType | undefined;
      const allowedMethod = isStatus ? "GET" : "POST, DELETE";
      if ((isStatus && request.method !== "GET") || (!isStatus && request.method !== "POST" && request.method !== "DELETE")) {
        corsHeaders.set("Allow", `${allowedMethod}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (isStatus) {
          if (!repository.getMyMovieStatus) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getMyMovieStatus(authUser, movieId), 200, corsHeaders);
        }
        if (request.method === "POST") {
          if (!repository.setMyMovieFlag) return json({ message: "Not found" }, 404, corsHeaders);
          await repository.setMyMovieFlag(authUser, movieId, flag!);
          return new Response(null, { status: 200, headers: corsHeaders });
        }
        if (!repository.deleteMyMovieFlag) return json({ message: "Not found" }, 404, corsHeaders);
        await repository.deleteMyMovieFlag(authUser, movieId, flag!);
        return new Response(null, { status: 204, headers: corsHeaders });
      } catch {
        return json({ message: "Unable to update movie status" }, 500, corsHeaders);
      }
    }
    if (path === "/api/users/me") {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier || !repository.getOrCreateCurrentUser) {
        return json({ message: "Authentication required" }, 401, corsHeaders);
      }
      try {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
        const user = await repository.getOrCreateCurrentUser(authUser);
        return json(user, 200, corsHeaders);
      } catch (error) {
        if (error instanceof RewindApiError) return json({ message: error.message }, error.status, corsHeaders);
        return json({ message: "Unable to load account" }, 409, corsHeaders);
      }
    }
    const ratingMatch = path.match(MOVIE_RATING_PATTERN);
    if (ratingMatch) {
      const movieId = Number(ratingMatch[1]);
      if (!Number.isSafeInteger(movieId) || movieId <= 0) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
      const isReadRoute = ratingMatch[2] === "me";
      const allowedMethod = isReadRoute ? "GET" : "PUT, DELETE";
      if ((isReadRoute && request.method !== "GET") || (!isReadRoute && request.method !== "PUT" && request.method !== "DELETE")) {
        corsHeaders.set("Allow", `${allowedMethod}, OPTIONS`);
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (isReadRoute) {
          if (!repository.getMyRating) return json({ message: "Not found" }, 404, corsHeaders);
          const rating = await repository.getMyRating(authUser, movieId);
          return rating === null
            ? new Response(null, { status: 204, headers: corsHeaders })
            : json({ rating }, 200, corsHeaders);
        }
        if (request.method === "DELETE") {
          if (!repository.deleteMyRating) return json({ message: "Not found" }, 404, corsHeaders);
          await repository.deleteMyRating(authUser, movieId);
          return new Response(null, { status: 204, headers: corsHeaders });
        }
        if (!repository.setMyRating) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const rating = (body as { rating?: unknown } | null)?.rating;
        if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
          return json({ message: "Rating must be an integer from 1 to 5" }, 400, corsHeaders);
        }
        await repository.setMyRating(authUser, movieId, rating);
        return new Response(null, { status: 200, headers: corsHeaders });
      } catch {
        return json({ message: "Unable to update rating" }, 500, corsHeaders);
      }
    }
    if (path === GENRES_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }

      try {
        const genres = await repository.listGenres();
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(genres, 200, corsHeaders);
      } catch {
        return json({ message: "Internal server error" }, 500, corsHeaders);
      }
    }

    if (path === MOVIES_SEARCH_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }

      const query = new URL(request.url).searchParams;
      const genreId = optionalPositiveInteger(query.get("genreId"));
      const year = optionalPositiveInteger(query.get("year"));
      const minRating = optionalFiniteNumber(query.get("minRating"));
      const q = query.get("q")?.trim() || null;
      if ((query.has("genreId") && genreId === null) || (query.has("year") && year === null)
        || (query.has("minRating") && minRating === null)
        || (year !== null && (year < 1888 || year > 2100))
        || (minRating !== null && (minRating < 0 || minRating > 5))) {
        return json({ message: "Invalid search parameters" }, 400, corsHeaders);
      }
      if (q && q.length > 100) return json({ message: "Search query is too long" }, 400, corsHeaders);
      const rawPage = query.get("page");
      const page = rawPage === null ? 0 : optionalInteger(rawPage, -1);
      if (page < 0 || page > 100) return json({ message: "Invalid page" }, 400, corsHeaders);
      const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));

      try {
        const result = await repository.searchMovies({
          q,
          genreId,
          year,
          minRating,
          sort: query.get("sort") ?? "newest",
          page,
          size,
        });
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(result, 200, corsHeaders);
      } catch {
        return json({ message: "Internal server error" }, 500, corsHeaders);
      }
    }

    if (path === GLOBAL_SEARCH_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (!repository.searchGlobal) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const rawQuery = query.get("q");
      if (rawQuery === null || rawQuery.length > 200) return json({ message: "Invalid search query" }, 400, corsHeaders);
      const requestedSize = optionalInteger(query.get("size"), 6);
      if (requestedSize < 1) return json({ message: "Invalid page size" }, 400, corsHeaders);
      const size = Math.min(requestedSize, 12);
      const language = query.get("language") === "en" ? "en" : "uk";
      try {
        const result = await repository.searchGlobal(rawQuery.trim(), language, size);
        corsHeaders.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
        return json(result, 200, corsHeaders);
      } catch {
        return json({ message: "Unable to search REWIND" }, 500, corsHeaders);
      }
    }

    if (path === PEOPLE_SEARCH_PATH) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const query = new URL(request.url).searchParams;
      const rawType = query.get("type") ?? "actor";
      if (rawType !== "actor" && rawType !== "director" && rawType !== "producer") {
        return json({ message: "Invalid person type" }, 400, corsHeaders);
      }
      const q = query.get("q")?.trim() || null;
      if (q && q.length > 100) return json({ message: "Search query is too long" }, 400, corsHeaders);
      const rawPage = query.get("page");
      const parsedPage = rawPage === null ? 0 : optionalInteger(rawPage, -1);
      if (parsedPage < 0 || parsedPage > 100) return json({ message: "Invalid page" }, 400, corsHeaders);
      const page = parsedPage;
      const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));
      try {
        const result = await repository.searchPeople({
          q,
          type: rawType === "actor" ? "ACTOR" : rawType === "director" ? "DIRECTOR" : "PRODUCER",
          page,
          size,
        });
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(result, 200, corsHeaders);
      } catch {
        return json({ message: "Internal server error" }, 500, corsHeaders);
      }
    }

    const movieDetailsMatch = path.match(MOVIE_DETAILS_PATTERN);
    if (movieDetailsMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      const movieId = Number(movieDetailsMatch[1]);
      if (!Number.isSafeInteger(movieId) || movieId <= 0) {
        return json({ message: "Invalid movie ID" }, 400, corsHeaders);
      }
      try {
        const details = await repository.getMovieDetails(movieId);
        if (!details) return json({ message: "Not found" }, 404, corsHeaders);
        const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
        if (bearer && authVerifier && repository.getMyMovieStatus) {
          const authUser = await authVerifier.verifyAccessToken(bearer);
          if (authUser?.emailConfirmed) {
            const status = await repository.getMyMovieStatus(authUser, movieId);
            return json({
              ...details,
              myFlags: { watched: status.watched, watchlist: status.inWatchlist, favorites: status.favorite },
            }, 200, corsHeaders);
          }
        }
        corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return json(details, 200, corsHeaders);
      } catch {
        return json({ message: "Internal server error" }, 500, corsHeaders);
      }
    }

    const personMatch = path.match(PERSON_FILMOGRAPHY_PATTERN);
    if (personMatch) {
      if (request.method !== "GET") {
        corsHeaders.set("Allow", "GET, OPTIONS");
        return json({ message: "Method not allowed" }, 405, corsHeaders);
      }
      if (!/^\d+$/.test(personMatch[2])) return json({ message: "Invalid person ID" }, 400, corsHeaders);
      const personId = Number(personMatch[2]);
      if (!Number.isSafeInteger(personId) || personId <= 0) return json({ message: "Invalid person ID" }, 400, corsHeaders);
      const query = new URL(request.url).searchParams;
      const rawGenreId = query.get("genreId");
      const genreId = rawGenreId === null ? null : optionalPositiveInteger(rawGenreId);
      if (rawGenreId !== null && genreId === null) return json({ message: "Invalid genre ID" }, 400, corsHeaders);
      const type = personMatch[1] === "actors" ? "ACTOR" : personMatch[1] === "directors" ? "DIRECTOR" : "PRODUCER";
      try {
        const person = await repository.getPersonFilmography(type, personId, genreId, query.get("sort") ?? "newest");
        if (person) corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return person ? json(person, 200, corsHeaders) : json({ message: "Not found" }, 404, corsHeaders);
      } catch {
        return json({ message: "Internal server error" }, 500, corsHeaders);
      }
    }

    return json({ message: "Not found" }, 404, corsHeaders);
  };
}

function optionalInteger(value: string | null, fallback: number): number {
  if (value === null || !/^-?\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

const INVALID_QUERY = Symbol("invalid query parameter");
function parseOptionalBoolean(value: string | null): boolean | null | typeof INVALID_QUERY {
  if (value === null || value === "") return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return INVALID_QUERY;
}

function parseOptionalLong(value: string | null): number | null | typeof INVALID_QUERY {
  if (value === null || value === "") return null;
  if (!/^-?\d+$/.test(value)) return INVALID_QUERY;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : INVALID_QUERY;
}

function parseAdminPage(query: URLSearchParams, maximumSize = 50, defaultSize = 20): { page: number; size: number } | null {
  const parse = (key: string, fallback: number): number | null => {
    const value = query.get(key);
    if (value === null) return fallback;
    if (!/^-?\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && Math.abs(parsed) <= 2_147_483_647 ? parsed : null;
  };
  const requestedPage = parse("page", 0);
  const requestedSize = parse("size", defaultSize);
  if (requestedPage === null || requestedSize === null) return null;
  return { page: Math.max(0, requestedPage), size: Math.max(1, Math.min(requestedSize, maximumSize)) };
}

function parseAdminUserUpdate(value: unknown): AdminUserUpdateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: AdminUserUpdateRequest = {};
  if (body.username !== undefined && body.username !== null) {
    if (typeof body.username !== "string" || body.username.length < 3 || body.username.length > 50 || !/\S/.test(body.username) || /[\r\n]/.test(body.username)) return null;
    update.username = body.username;
  }
  if (body.displayName !== undefined && body.displayName !== null) {
    if (typeof body.displayName !== "string" || body.displayName.length > 60
      || (body.displayName !== "" && (body.displayName.length < 2 || !/\S/.test(body.displayName)))) return null;
    update.displayName = body.displayName;
  }
  if (body.avatarUrl !== undefined && body.avatarUrl !== null) {
    if (typeof body.avatarUrl !== "string" || body.avatarUrl.length > 255
      || (body.avatarUrl !== "" && !/^https?:\/\/\S+$/i.test(body.avatarUrl))) return null;
    update.avatarUrl = body.avatarUrl;
  }
  if (body.role !== undefined && body.role !== null) {
    if (typeof body.role !== "string") return null;
    const role = body.role.trim().toUpperCase();
    if (role !== "USER" && role !== "ADMIN") return null;
    update.role = role;
  }
  if (body.isActive !== undefined && body.isActive !== null) {
    if (typeof body.isActive !== "boolean") return null;
    update.isActive = body.isActive;
  }
  return update;
}

function parseAdminMovieWrite(value: unknown, create: boolean): AdminMovieWriteRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const result: AdminMovieWriteRequest = {};
  if (body.title !== undefined && body.title !== null) {
    if (typeof body.title !== "string" || body.title.length > 255 || !/\S/.test(body.title)) return null;
    result.title = body.title;
  } else if (create) return null;
  const strings = [
    ["imdbId", 20], ["ageRating", 10], ["shortPlot", 10000],
    ["photoUrl", 255], ["backdropUrl", 255], ["trailerUrl", 255],
  ] as const;
  for (const [key, maximum] of strings) {
    const raw = body[key];
    if (raw === undefined) continue;
    if (raw !== null && (typeof raw !== "string" || raw.length > maximum)) return null;
    if (key === "trailerUrl" && typeof raw === "string" && raw !== "" && !/^https?:\/\/\S+$/i.test(raw)) return null;
    (result as Record<string, unknown>)[key] = raw;
  }
  if (body.durationMinutes !== undefined) {
    if (body.durationMinutes !== null && (!Number.isSafeInteger(body.durationMinutes) || (body.durationMinutes as number) <= 0)) return null;
    result.durationMinutes = body.durationMinutes as number | null;
  }
  if (body.rating !== undefined) {
    if (body.rating !== null && (typeof body.rating !== "number" || !Number.isFinite(body.rating) || body.rating < 0 || body.rating > 10)) return null;
    result.rating = body.rating as number | null;
  }
  if (body.releaseDate !== undefined) {
    if (body.releaseDate !== null && (typeof body.releaseDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.releaseDate)
      || Number.isNaN(Date.parse(`${body.releaseDate}T00:00:00Z`))
      || new Date(`${body.releaseDate}T00:00:00Z`).toISOString().slice(0, 10) !== body.releaseDate)) return null;
    result.releaseDate = body.releaseDate as string | null;
  }
  return result;
}

function parseModerationReason(value: unknown, maxLength: number): string | null | false {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const reason = (value as Record<string, unknown>).reason;
  if (reason === undefined || reason === null) return null;
  return typeof reason === "string" && reason.length <= maxLength ? reason : false;
}

function parseReviewReportReason(value: unknown): ReviewReportReason | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const reason = (value as Record<string, unknown>).reason;
  return reason === "SPAM" || reason === "INAPPROPRIATE_CONTENT" || reason === "BULLYING" ? reason : null;
}

function parseBulkModeration(value: unknown): { items: AdminModerationTarget[]; reason: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50
    || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 500) return null;
  const items: AdminModerationTarget[] = [];
  for (const item of body.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const target = item as Record<string, unknown>;
    if (typeof target.type !== "string" || !target.type.trim() || typeof target.id !== "number"
      || !Number.isSafeInteger(target.id) || target.id <= 0) return null;
    items.push({ type: target.type, id: target.id });
  }
  return { items, reason: body.reason };
}

function parseAdminCreateNotification(value: unknown): AdminCreateNotificationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const positiveId = (key: string, required: boolean): number | null | false => {
    const item = body[key];
    if ((item === undefined || item === null) && !required) return null;
    if (typeof item !== "number" || !Number.isSafeInteger(item) || item <= 0) return false;
    return item;
  };
  const recipientId = positiveId("recipientId", true);
  const actorId = positiveId("actorId", true);
  const relatedUserId = positiveId("relatedUserId", false);
  const reviewId = positiveId("reviewId", false);
  if (recipientId === false || actorId === false || recipientId === null || actorId === null || relatedUserId === false || reviewId === false) return null;
  if (body.type !== "FOLLOW" && body.type !== "REVIEW_LIKED") return null;
  if (body.type === "FOLLOW" && (recipientId === actorId || relatedUserId !== actorId || reviewId !== null)) return null;
  if (body.type === "REVIEW_LIKED" && (recipientId === actorId || relatedUserId !== null || reviewId === null)) return null;
  return { recipientId, actorId, type: body.type, relatedUserId, reviewId };
}

function parseProfileUpdate(value: unknown): ProfileUpdateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: ProfileUpdateRequest = {};
  if (body.displayName !== undefined && body.displayName !== null) {
    if (typeof body.displayName !== "string") return null;
    const name = body.displayName;
    if (name.length > 60 || (name !== "" && (name.length < 2 || !/\S/.test(name)))) return null;
    update.displayName = name;
  }
  if (body.avatarUrl !== undefined && body.avatarUrl !== null) {
    if (typeof body.avatarUrl !== "string") return null;
    const avatar = body.avatarUrl;
    if (avatar.length > 255 || (avatar !== "" && !/^https?:\/\/\S+$/.test(avatar))) return null;
    update.avatarUrl = avatar;
  }
  return update;
}

function parseAdminJournalArticle(value: unknown): AdminJournalArticleRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const nullableText = (key: string, max: number): string | null | false => {
    const item = body[key];
    if (item === undefined || item === null) return null;
    if (typeof item !== "string" || item.length > max) return false;
    return item;
  };
  const excerpt = nullableText("excerpt", 500);
  const coverUrl = nullableText("coverUrl", 500);
  const audioUrl = nullableText("audioUrl", 500);
  if (excerpt === false || coverUrl === false || audioUrl === false) return null;
  if (typeof body.slug !== "string" || !body.slug.trim() || body.slug.trim().length > 180
    || (body.language !== "uk" && body.language !== "en")
    || typeof body.category !== "string" || !body.category.trim() || body.category.trim().length > 80
    || typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 255
    || typeof body.content !== "string" || !body.content.trim()
    || (body.published !== undefined && typeof body.published !== "boolean")
    || (audioUrl !== null && !/^https?:\/\/\S+$/i.test(audioUrl))) return null;
  return { slug: body.slug.trim(), language: body.language, category: body.category.trim(), title: body.title.trim(),
    excerpt, content: body.content, coverUrl, audioUrl, published: body.published === true };
}

function parseCreateReview(value: unknown): { content: string; rating: number } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.content !== "string" || body.content.length < 1 || body.content.length > 5000 || !/\S/.test(body.content)) return null;
  if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return null;
  return { content: body.content, rating: body.rating };
}

function parseReviewUpdate(value: unknown): ReviewMutationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: ReviewMutationRequest = {};
  if (body.content !== undefined) {
    if (typeof body.content !== "string" || body.content.length < 1 || body.content.length > 5000 || !/\S/.test(body.content)) return null;
    update.content = body.content;
  }
  if (body.rating !== undefined && body.rating !== null) {
    if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return null;
    update.rating = body.rating;
  }
  return update;
}

function parseCommentText(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const text = (value as Record<string, unknown>).text;
  if (typeof text !== "string" || text.length > 2000 || !/\S/.test(text)) return null;
  return text;
}

function optionalPositiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalFiniteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRouteId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseCreateMyList(value: unknown): CreateMyListRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 120) return null;
  if (body.description !== undefined && body.description !== null
    && (typeof body.description !== "string" || body.description.length > 5000)) return null;
  if (body.isPublic !== undefined && body.isPublic !== null && typeof body.isPublic !== "boolean") return null;
  const tags = parseListTags(body.tags);
  if (tags === null) return null;
  if (!Array.isArray(body.movieIds) || body.movieIds.length < 1 || body.movieIds.length > 100) return null;
  const movieIds = body.movieIds.map(parsePositiveId);
  if (movieIds.some((id) => id === null)) return null;
  return {
    name: body.name,
    description: typeof body.description === "string" ? body.description : null,
    isPublic: body.isPublic === true,
    tags,
    movieIds: movieIds as number[],
  };
}

function parseUpdateMyList(value: unknown): UpdateMyListRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: UpdateMyListRequest = {};
  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 120) return null;
    update.name = body.name;
  }
  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) return null;
    update.description = body.description as string | null;
  }
  if (body.isPublic !== undefined && body.isPublic !== null) {
    if (typeof body.isPublic !== "boolean") return null;
    update.isPublic = body.isPublic;
  }
  if (body.tags !== undefined && body.tags !== null) {
    const tags = parseListTags(body.tags);
    if (tags === null) return null;
    update.tags = tags;
  }
  return update;
}

function parseListTags(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 10) return null;
  const tags = value as unknown[];
  if (tags.some((tag) => typeof tag !== "string" || tag.length < 1 || tag.length > 50)) return null;
  return tags as string[];
}

function parseAddListMovie(value: unknown): { movieId: number; position: number | null } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const movieId = parsePositiveId(body.movieId);
  if (movieId === null) return null;
  let position: number | null = null;
  if (body.position !== undefined && body.position !== null) {
    if (typeof body.position !== "number" || !Number.isSafeInteger(body.position)
      || body.position < 0 || body.position > 2147483647) return null;
    position = body.position;
  }
  return { movieId, position };
}

function parseOrderedItemIds(value: unknown): number[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = (value as Record<string, unknown>).orderedItemIds;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 10000) return null;
  const ids = raw.map(parsePositiveId);
  if (ids.some((id) => id === null)) return null;
  return ids as number[];
}

function parsePositiveId(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}
