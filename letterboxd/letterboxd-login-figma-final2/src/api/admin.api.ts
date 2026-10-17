import api from "./axios";

export interface AdminDashboard { users: number; activeUsers: number; hqUsers: number; movies: number; reviews: number; hiddenReviews: number }
export interface AdminUser { id: number; username: string; displayName: string | null; email: string; role: string; avatarUrl: string | null; isActive: boolean; isHq: boolean }
export interface AuditLog { id: number; adminId: number; action: string; targetType: string; targetId: number | null; metadata: string | null; createdAt: string }
export interface AdminComment { id: number; reviewId: number; userId: number; username: string; content: string; isHidden: boolean; moderatedReason: string | null; moderatedAt: string | null; createdAt: string }
export interface AdminArticle { id: number; slug: string; language: string; category: string; title: string; excerpt: string | null; content: string; coverUrl: string | null; audioUrl: string | null; publishedAt: string | null }
export interface NewsletterDeliveryStatus { articleId: number; pending: number; sending: number; sent: number; failed: number; cancelled: number }
export interface AdminReview { id: number; movieId: number; movieTitle: string; userId: number; username: string; content: string; rating: number | null; isHidden: boolean; moderatedReason: string | null; moderatedAt: string | null; createdAt: string }
export interface AdminMovie { id: number; tmdbId: number | null; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }
export interface AdminMovieWrite { title: string; releaseDate?: string | null; rating?: number | null; photoUrl?: string | null }
export interface TmdbSyncResponse { movieId: number; tmdbId: number; title: string; genresUpdated: number; actorsUpdated: number; directorsUpdated: number; similarMoviesLinked: number; trailerUpdated: boolean }
export interface TmdbImportItem { movieId: number | null; tmdbId: number; status: "IMPORTED" | "FAILED"; title: string | null; message: string }
export interface TmdbBatchSyncResponse { requested: number; succeeded: number; failed: number; items: TmdbImportItem[] }
export interface TmdbDiscoveryRequest { page: number; year?: number; genreId?: number; minRating?: number; limit: number; syncSimilar?: boolean }
export interface TmdbDiscoveryImportResponse { page: number; totalPages: number; totalResults: number; discovered: number; imports: TmdbBatchSyncResponse }
export interface AdminList { id: number; userId: number; username: string; name: string; description: string | null; listType: string; isPublic: boolean; itemCount: number; createdAt: string; updatedAt: string }
export interface AdminConversation { id: number; userOneId: number; userTwoId: number; messageCount: number; createdAt: string; updatedAt: string; lastMessageAt: string | null }
export interface AdminNotification { id: number; recipientId: number; actorId: number | null; type: string; reviewId: number | null; createdAt: string; readAt: string | null }
export interface AdminNotificationWrite { recipientId: number; type: "FOLLOW" | "REVIEW_LIKED"; actorId?: number | null; relatedUserId?: number | null; reviewId?: number | null }
export interface AdminNotificationFilters { type?: AdminNotificationWrite["type"]; read?: boolean; recipientId?: number }
export interface AdminModerationQueueItem { type: "REVIEW" | "COMMENT"; id: number; parentId: number | null; movieId: number | null; subject: string; userId: number; username: string; content: string; createdAt: string }
export interface AdminModerationFilters { type?: AdminModerationQueueItem["type"]; query?: string }
export interface AdminSetting { key: string; value: string; updatedBy: number | null; updatedAt: string }
export interface Page<T> { content: T[]; totalPages: number; totalElements: number }
export const getAdminDashboard = () => api.get<AdminDashboard>("/admin/dashboard");
export const getAdminUsers = (q = "") => api.get<Page<AdminUser>>("/admin/users", { params: { size: 50, ...(q.trim() ? { q: q.trim() } : {}) } });
export const setAdminHq = (id: number, hq: boolean) => api.put<AdminUser>(`/admin/users/${id}/hq`, { hq });
export const setAdminUserActive = (id: number, active: boolean) => api.post(`/admin/users/${id}/${active ? "activate" : "deactivate"}`);
export const getAuditLogs = () => api.get<Page<AuditLog>>("/admin/audit-logs", { params: { size: 50 } });
export const getAdminComments = () => api.get<Page<AdminComment>>("/admin/comments", { params: { size: 50 } });
export const setAdminCommentHidden = (id: number, hidden: boolean, reason = "") => api.post<AdminComment>(`/admin/comments/${id}/${hidden ? "hide" : "unhide"}`, { reason });
export const getAdminArticles = () => api.get<Page<AdminArticle>>("/admin/journal/articles", { params: { size: 50 } });
export const createAdminArticle = (article: Omit<AdminArticle, "id" | "publishedAt"> & { published: boolean }) => api.post<AdminArticle>("/admin/journal/articles", article);
export const queueAdminNewsletter = (articleId: number) => api.post<{ articleId: number; recipients: number }>(`/admin/journal/articles/${articleId}/newsletter`);
export const getAdminNewsletterStatus = (articleId: number) => api.get<NewsletterDeliveryStatus>(`/admin/journal/articles/${articleId}/newsletter`);
export const getAdminReviews = () => api.get<Page<AdminReview>>("/admin/reviews", { params: { size: 50 } });
export const setAdminReviewHidden = (id: number, hidden: boolean, reason = "") => api.post<AdminReview>(`/admin/reviews/${id}/${hidden ? "hide" : "unhide"}`, { reason });
export const getAdminMovies = () => api.get<Page<AdminMovie>>("/admin/movies", { params: { size: 50 } });
export const createAdminMovie = (movie: AdminMovieWrite) => api.post<AdminMovie>("/admin/movies", movie);
export const updateAdminMovie = (id: number, movie: Partial<AdminMovieWrite>) => api.put<AdminMovie>(`/admin/movies/${id}`, movie);
export const deleteAdminMovie = (id: number) => api.delete(`/admin/movies/${id}`);
export const syncAdminMovieTmdb = (id: number, tmdbId: number, syncSimilar = true) => api.post<TmdbSyncResponse>(`/admin/movies/${id}/tmdb-sync`, { tmdbId, syncSimilar });
export const importAdminTmdb = (tmdbIds: number[], syncSimilar = true) => api.post<TmdbBatchSyncResponse>("/admin/movies/tmdb-import", { tmdbIds, syncSimilar });
export const discoverAndImportAdminTmdb = (request: TmdbDiscoveryRequest) => api.post<TmdbDiscoveryImportResponse>("/admin/movies/tmdb-import/discover", { ...request, syncSimilar: request.syncSimilar ?? true });
export const getAdminLists = () => api.get<Page<AdminList>>("/admin/lists", { params: { size: 50 } });
export const setAdminListVisibility = (id: number, visible: boolean) => api.put<AdminList>(`/admin/lists/${id}/visibility`, null, { params: { visible } });
export const deleteAdminList = (id: number) => api.delete(`/admin/lists/${id}`);
export const getAdminConversations = () => api.get<Page<AdminConversation>>("/admin/conversations", { params: { size: 50 } });
export const getAdminNotifications = (filters: AdminNotificationFilters = {}) => api.get<Page<AdminNotification>>("/admin/notifications", { params: { size: 50, ...filters } });
export const createAdminNotification = (notification: AdminNotificationWrite) => api.post<AdminNotification>("/admin/notifications", notification);
export const deleteAdminConversation = (id: number) => api.delete(`/admin/conversations/${id}`);
export const deleteAdminNotification = (id: number) => api.delete(`/admin/notifications/${id}`);
export const setAdminNotificationRead = (id: number, read: boolean) => api.patch<AdminNotification>(`/admin/notifications/${id}/${read ? "read" : "unread"}`);
export const markAdminNotificationsRead = (filters: Omit<AdminNotificationFilters, "read"> = {}) => api.patch<{ updated: number }>("/admin/notifications/read-all", null, { params: filters });
export const deleteAdminNotifications = (filters: AdminNotificationFilters = {}) => api.delete<{ deleted: number }>("/admin/notifications", { params: filters });
export const getAdminModerationQueue = (filters: AdminModerationFilters = {}) => api.get<Page<AdminModerationQueueItem>>("/admin/moderation/queue", { params: { size: 50, ...filters } });
export const hideAdminModerationItem = (item: Pick<AdminModerationQueueItem, "type" | "id">, reason = "Moderated by administrator") => api.post(`/admin/moderation/${item.type}/${item.id}/hide`, { reason });
export const bulkHideAdminModeration = (items: Array<Pick<AdminModerationQueueItem, "type" | "id">>, reason: string) => api.post<{ hidden: number }>("/admin/moderation/bulk-hide", { items, reason });
export const getAdminSettings = () => api.get<AdminSetting[]>("/admin/settings");
export const updateAdminSetting = (key: string, value: string) => api.put<AdminSetting>(`/admin/settings/${encodeURIComponent(key)}`, { value });
