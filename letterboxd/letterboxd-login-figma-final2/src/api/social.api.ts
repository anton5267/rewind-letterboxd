import api from "./axios";

export interface PublicNetworkUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NetworkPage {
  content: PublicNetworkUser[];
  number: number;
  totalPages: number;
  totalElements: number;
}

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

export interface ActivityPage {
  content: Activity[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface PopularReviewer extends PublicNetworkUser {
  likes: number;
}

export const getFollowers = (userId: string | number, page = 0) => api.get<NetworkPage>(`/users/${userId}/followers`, { params: { page, size: 8 } });
export const getFollowing = (userId: string | number, page = 0) => api.get<NetworkPage>(`/users/${userId}/following`, { params: { page, size: 8 } });
export const getFollowStatus = (userId: string | number) => api.get<FollowStatus>(`/users/${userId}/follow-status`);
export const follow = (userId: string | number) => api.post(`/users/${userId}/follow`);
export const unfollow = (userId: string | number) => api.delete(`/users/${userId}/follow`);
export const getBlockStatus = (userId: string | number) => api.get<BlockStatus>(`/users/${userId}/block-status`);
export const blockUser = (userId: string | number) => api.post<BlockStatus>(`/users/${userId}/block`);
export const unblockUser = (userId: string | number) => api.delete<BlockStatus>(`/users/${userId}/block`);
export const getUserActivity = (userId: string | number, page = 0) => api.get<ActivityPage>(`/users/${userId}/activity`, { params: { page, size: 10 } });
export const getPopularReviewers = () => api.get<PopularReviewer[]>("/users/popular-reviewers", { params: { size: 6 } });
