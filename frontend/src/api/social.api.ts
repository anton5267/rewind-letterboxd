import api from "./axios";
import type { NumberedPage } from "./types";

export interface PublicNetworkUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export type NetworkPage = NumberedPage<PublicNetworkUser>;

export interface FollowStatus {
  following: boolean;
  followers: number;
  followingCount: number;
}

export interface BlockStatus { blocked: boolean }

export interface Activity {
  id: number;
  type: "FOLLOW" | "RATING" | "REVIEW" | "LIST";
  createdAt: string;
  actor: PublicNetworkUser | null;
  movie: { id: number; title: string } | null;
  relatedUser: { id: number; username: string; displayName: string } | null;
  list: { id: number; name: string } | null;
}

export type ActivityPage = NumberedPage<Activity>;

export interface PopularReviewer extends PublicNetworkUser {
  likes: number;
}

export interface CommunityUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type CommunityUserPage = NumberedPage<CommunityUser>;

export interface RecentWatchedActivity {
  id: number;
  createdAt: string;
  actor: { id: number; username: string; displayName: string | null } | null;
  movie: { id: number; title: string } | null;
}

export const getFollowers = (userId: string | number, page = 0) => api.get<NetworkPage>(`/users/${userId}/followers`, { params: { page, size: 8 } });
export const getFollowing = (userId: string | number, page = 0) => api.get<NetworkPage>(`/users/${userId}/following`, { params: { page, size: 8 } });
export const getFollowStatus = (userId: string | number) => api.get<FollowStatus>(`/users/${userId}/follow-status`);
export const follow = (userId: string | number) => api.post<void>(`/users/${userId}/follow`);
export const unfollow = (userId: string | number) => api.delete<void>(`/users/${userId}/follow`);
export const getBlockStatus = (userId: string | number) => api.get<BlockStatus>(`/users/${userId}/block-status`);
export const blockUser = (userId: string | number) => api.post<BlockStatus>(`/users/${userId}/block`);
export const unblockUser = (userId: string | number) => api.delete<BlockStatus>(`/users/${userId}/block`);
export const getUserActivity = (userId: string | number, page = 0) => api.get<ActivityPage>(`/users/${userId}/activity`, { params: { page, size: 10 } });
export const getPopularReviewers = (size = 6) => api.get<PopularReviewer[]>("/users/popular-reviewers", { params: { size } });
export const getHqUsers = () => api.get<CommunityUserPage>("/users/hq", { params: { page: 0, size: 12 } });
export const getDirectoryUsers = (query: string, page: number) => api.get<CommunityUserPage>("/users/directory", { params: { q: query || undefined, page, size: 12 } });
export const getRecentWatched = (size = 6) => api.get<{ content: RecentWatchedActivity[] }>("/activity/recent-watched", { params: { size } });
