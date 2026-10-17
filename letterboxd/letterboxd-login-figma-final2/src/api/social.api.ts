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

export const getFollowers = (userId: string | number) => api.get<NetworkPage>(`/users/${userId}/followers`, { params: { size: 8 } });
export const getFollowing = (userId: string | number) => api.get<NetworkPage>(`/users/${userId}/following`, { params: { size: 8 } });
export const getFollowStatus = (userId: string | number) => api.get<FollowStatus>(`/users/${userId}/follow-status`);
export const follow = (userId: string | number) => api.post(`/users/${userId}/follow`);
export const unfollow = (userId: string | number) => api.delete(`/users/${userId}/follow`);
