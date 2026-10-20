import api from "./axios";
import type { NumberedPage, Page } from "./types";

export interface UserList {
  id: number;
  name: string;
  description: string | null;
  listType: string;
  isPublic: boolean;
  tags: string[];
}

export type UserListPage = NumberedPage<UserList>;

export interface PublicListLikeStatus {
  liked: boolean;
  likes: number;
}

export interface MoviePreview {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export interface PublicList {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  tags: string[];
  likeCount?: number | null;
  itemCount?: number | null;
  previewMovies: MoviePreview[];
}

export interface PublicListDetails {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
  tags: string[];
  likeCount: number;
  movies: MoviePreview[];
}

export interface UserListItem {
  id: number;
  position: number | null;
  movie: MoviePreview;
}

export const getUserLists = () => api.get<UserList[]>("/lists/my");
export const getUserListsPage = (page: number) => api.get<UserListPage>("/lists/my/page", { params: { page, size: 12 } });
export const getPublicListFeed = (feed: "recent" | "popular" | "recently-liked" | "team", page: number, tag?: string, size = 12) => {
  const endpoint = feed === "popular" ? "/lists/public/popular"
    : feed === "recently-liked" ? "/lists/public/recently-liked"
      : feed === "team" ? "/lists/public/team" : "/lists/public";
  return api.get<Page<PublicList>>(endpoint, { params: { page, size, ...(feed === "recent" && tag ? { tag } : {}) } });
};
export const getPublicList = (listId: string | number) => api.get<PublicListDetails>(`/lists/public/${listId}`);
export const getPublicListLikeStatus = (listId: string | number) => api.get<PublicListLikeStatus>(`/lists/public/${listId}/like-status`);
export const likePublicList = (listId: string | number) => api.post<void>(`/lists/${listId}/likes`);
export const unlikePublicList = (listId: string | number) => api.delete<void>(`/lists/${listId}/likes`);

export const createList = (name: string, description: string, isPublic: boolean, tags: string[]) =>
  api.post<UserList>("/lists", { name, description: description || null, isPublic, tags });

export const updateList = (listId: number, name: string, description: string, isPublic: boolean, tags: string[]) =>
  api.patch<UserList>(`/lists/${listId}`, { name, description: description || null, isPublic, tags });

export const deleteList = (listId: number) => api.delete<void>(`/lists/${listId}`);

export const getListItems = (listId: number) => api.get<UserListItem[]>(`/lists/${listId}/items`);

export const addMovieToList = (listId: number, movieId: number) =>
  api.post<void>(`/lists/${listId}/movies`, { movieId });

export const removeMovieFromList = (listId: number, movieId: number) =>
  api.delete<void>(`/lists/${listId}/movies/${movieId}`);

export const reorderListItems = (listId: number, orderedItemIds: number[]) =>
  api.put<void>(`/lists/${listId}/items/reorder`, { orderedItemIds });
