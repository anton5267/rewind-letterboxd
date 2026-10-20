import api from "./axios";
import type { NumberedPage } from "./types";

export interface Comment {
  id: number;
  reviewId: number;
  userId: number;
  username: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentPage = NumberedPage<Comment>;

export const getComments = (reviewId: number, page = 0, size = 20) =>
  api.get<CommentPage>(`/reviews/${reviewId}/comments`, { params: { page, size } });

export const addComment = (reviewId: number, text: string) =>
  api.post<Comment>(`/reviews/${reviewId}/comments`, { text });

export const updateComment = (commentId: number, text: string) =>
  api.patch<Comment>(`/comments/${commentId}`, { text });

export const deleteComment = (commentId: number) =>
  api.delete<void>(`/comments/${commentId}`);
