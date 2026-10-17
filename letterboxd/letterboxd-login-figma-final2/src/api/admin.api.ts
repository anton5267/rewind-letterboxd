import api from "./axios";

export interface AdminDashboard { users: number; activeUsers: number; hqUsers: number; movies: number; reviews: number; hiddenReviews: number }
export interface AdminUser { id: number; username: string; displayName: string | null; email: string; role: string; avatarUrl: string | null; isActive: boolean; isHq: boolean }
export interface AuditLog { id: number; adminId: number; action: string; targetType: string; targetId: number | null; metadata: string | null; createdAt: string }
export interface Page<T> { content: T[]; totalPages: number; totalElements: number }
export const getAdminDashboard = () => api.get<AdminDashboard>("/admin/dashboard");
export const getAdminUsers = () => api.get<Page<AdminUser>>("/admin/users", { params: { size: 50 } });
export const setAdminHq = (id: number, hq: boolean) => api.put<AdminUser>(`/admin/users/${id}/hq`, { hq });
export const getAuditLogs = () => api.get<Page<AuditLog>>("/admin/audit-logs", { params: { size: 50 } });
