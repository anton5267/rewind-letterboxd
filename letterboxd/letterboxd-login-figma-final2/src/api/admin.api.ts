import api from "./axios";

export interface AdminDashboard { users: number; activeUsers: number; hqUsers: number; movies: number; reviews: number; hiddenReviews: number }
export interface AdminUser { id: number; username: string; displayName: string | null; email: string; role: string; avatarUrl: string | null; isActive: boolean; isHq: boolean }
export interface AuditLog { id: number; adminId: number; action: string; targetType: string; targetId: number | null; metadata: string | null; createdAt: string }
export interface AdminComment { id: number; reviewId: number; userId: number; username: string; content: string; isHidden: boolean; moderatedReason: string | null; moderatedAt: string | null; createdAt: string }
export interface AdminArticle { id: number; slug: string; language: string; category: string; title: string; excerpt: string | null; content: string; coverUrl: string | null; publishedAt: string | null }
export interface AdminReview { id: number; movieId: number; movieTitle: string; userId: number; username: string; content: string; rating: number | null; isHidden: boolean; moderatedReason: string | null; moderatedAt: string | null; createdAt: string }
export interface AdminMovie { id: number; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }
export interface AdminMovieWrite { title: string; releaseDate?: string | null; rating?: number | null; photoUrl?: string | null }
export interface AdminList { id: number; userId: number; username: string; name: string; description: string | null; listType: string; isPublic: boolean; itemCount: number; createdAt: string; updatedAt: string }
export interface AdminConversation { id: number; userOneId: number; userTwoId: number; messageCount: number; createdAt: string; updatedAt: string; lastMessageAt: string | null }
export interface AdminNotification { id: number; recipientId: number; actorId: number | null; type: string; reviewId: number | null; createdAt: string; readAt: string | null }
export interface AdminModerationQueueItem { type: "REVIEW" | "COMMENT"; id: number; parentId: number | null; movieId: number | null; subject: string; userId: number; username: string; content: string; createdAt: string }
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
export const getAdminReviews = () => api.get<Page<AdminReview>>("/admin/reviews", { params: { size: 50 } });
export const setAdminReviewHidden = (id: number, hidden: boolean, reason = "") => api.post<AdminReview>(`/admin/reviews/${id}/${hidden ? "hide" : "unhide"}`, { reason });
export const getAdminMovies = () => api.get<Page<AdminMovie>>("/admin/movies", { params: { size: 50 } });
export const createAdminMovie = (movie: AdminMovieWrite) => api.post<AdminMovie>("/admin/movies", movie);
export const updateAdminMovie = (id: number, movie: Partial<AdminMovieWrite>) => api.put<AdminMovie>(`/admin/movies/${id}`, movie);
export const deleteAdminMovie = (id: number) => api.delete(`/admin/movies/${id}`);
export const getAdminLists = () => api.get<Page<AdminList>>("/admin/lists", { params: { size: 50 } });
export const setAdminListVisibility = (id: number, visible: boolean) => api.put<AdminList>(`/admin/lists/${id}/visibility`, null, { params: { visible } });
export const getAdminConversations = () => api.get<Page<AdminConversation>>("/admin/conversations", { params: { size: 50 } });
export const getAdminNotifications = () => api.get<Page<AdminNotification>>("/admin/notifications", { params: { size: 50 } });
export const getAdminModerationQueue = () => api.get<Page<AdminModerationQueueItem>>("/admin/moderation/queue", { params: { size: 50 } });
