import api from "./axios";

export interface UserList {
  id: number;
  name: string;
  description: string | null;
  listType: string;
  isPublic: boolean;
  tags: string[];
}

export interface UserListPage {
  content: UserList[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface PublicListLikeStatus {
  liked: boolean;
  likes: number;
}

export interface PublicList {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerUsername: string;
  tags: string[];
  likeCount?: number | null;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

export const getUserLists = () => api.get("/lists/my");
export const getUserListsPage = (page: number) => api.get<UserListPage>("/lists/my/page", { params: { page, size: 12 } });
export const getPublicListFeed = (feed: "recent" | "popular" | "recently-liked" | "team", page: number, tag?: string) => {
  const endpoint = feed === "popular" ? "/lists/public/popular"
    : feed === "recently-liked" ? "/lists/public/recently-liked"
      : feed === "team" ? "/lists/public/team" : "/lists/public";
  return api.get<Page<PublicList>>(endpoint, { params: { page, size: 12, ...(feed === "recent" && tag ? { tag } : {}) } });
};
export const getPublicListLikeStatus = (listId: string | number) => api.get<PublicListLikeStatus>(`/lists/public/${listId}/like-status`);
export const likePublicList = (listId: string | number) => api.post(`/lists/${listId}/likes`);
export const unlikePublicList = (listId: string | number) => api.delete(`/lists/${listId}/likes`);

export const createList = (name: string, description: string, isPublic: boolean, tags: string[]) =>
  api.post("/lists", { name, description: description || null, isPublic, tags });

export const updateList = (listId: number, name: string, description: string, isPublic: boolean, tags: string[]) =>
  api.patch(`/lists/${listId}`, { name, description: description || null, isPublic, tags });

export const deleteList = (listId: number) => api.delete(`/lists/${listId}`);

export const getListItems = (listId: number) => api.get(`/lists/${listId}/items`);

export const addMovieToList = (listId: number, movieId: number) =>
  api.post(`/lists/${listId}/movies`, { movieId });

export const removeMovieFromList = (listId: number, movieId: number) =>
  api.delete(`/lists/${listId}/movies/${movieId}`);

export const reorderListItems = (listId: number, orderedItemIds: number[]) =>
  api.put(`/lists/${listId}/items/reorder`, { orderedItemIds });
