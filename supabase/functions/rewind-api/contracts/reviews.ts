export type ReviewReportReason = "SPAM" | "INAPPROPRIATE_CONTENT" | "BULLYING";

export interface ReviewReportResponse { id: number; reason: ReviewReportReason; createdAt: string }

export interface ReviewReportStatusResponse { reported: boolean; report: ReviewReportResponse | null }

export interface ReviewFeedResponse {
  content: {
    id: number; movieId: number; movieTitle: string; userId: number; username: string;
    content: string; rating: number | null; createdAt: string; moviePhotoUrl: string | null; userAvatarUrl: string | null;
  }[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewResponse {
  id: number;
  userId: number;
  username: string;
  userAvatarUrl: string | null;
  content: string;
  rating: number | null;
  createdAt: string;
}

export interface ReviewPageResponse {
  content: ReviewResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewDetailsResponse {
  id: number;
  content: string;
  rating: number | null;
  createdAt: string;
  author: { id: number; username: string; displayName: string | null; avatarUrl: string | null };
  movie: {
    id: number; title: string; releaseDate: string | null; durationMinutes: number | null;
    ageRating: string | null; photoUrl: string | null; backdropUrl: string | null; trailerUrl: string | null;
  };
  likes: number;
  likedBy: { id: number; username: string; displayName: string | null; avatarUrl: string | null }[];
}

export interface CommentResponse {
  id: number;
  reviewId: number;
  userId: number;
  username: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPageResponse {
  content: CommentResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewMutationRequest { content?: string; rating?: number | null }
