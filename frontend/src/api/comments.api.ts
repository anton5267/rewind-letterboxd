import api from "./axios";
import type { NumberedPage } from "./types";
import type { ReviewReportReason, ReviewReportStatus } from "./reviews.api";

export interface Comment {
  id: number;
  reviewId: number | null;
  listId?: number | null;
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

export const getListComments = (listId: number, page = 0, size = 20) =>
  api.get<CommentPage>(`/lists/public/${listId}/comments`, { params: { page, size } });

export const addListComment = (listId: number, text: string) =>
  api.post<Comment>(`/lists/public/${listId}/comments`, { text });

export const updateComment = (commentId: number, text: string) =>
  api.patch<Comment>(`/comments/${commentId}`, { text });

export const deleteComment = (commentId: number) =>
  api.delete<void>(`/comments/${commentId}`);

export const getMyCommentReport = (commentId: number) =>
  api.get<ReviewReportStatus>(`/comments/${commentId}/report`);

export const reportComment = (commentId: number, reason: ReviewReportReason) =>
  api.post<{ id: number; reason: ReviewReportReason; createdAt: string }>(`/comments/${commentId}/report`, { reason });
