export interface PublicSocialUser { id: number; username: string; displayName: string | null; avatarUrl: string | null }

export interface FollowStatusResponse { following: boolean; followers: number; followingCount: number }

export interface BlockStatusResponse { blocked: boolean }

export interface SocialLinkResponse { platform: string; url: string }

export interface NotificationResponse {
  id: number; type: "FOLLOW" | "REVIEW_LIKED"; createdAt: string; readAt: string | null;
  actor: { id: number; username: string; displayName: string | null; avatarUrl: string | null } | null;
  relatedUserId: number | null; reviewId: number | null;
}

export interface NotificationPreferencesResponse { followsEnabled: boolean; reviewLikesEnabled: boolean }

export interface MessageResponse { id: number; conversationId: number; senderId: number; body: string; createdAt: string; readAt: string | null }

export interface ConversationResponse {
  id: number; otherUser: PublicSocialUser; updatedAt: string;
  lastMessage: { id: number; senderId: number; body: string; createdAt: string; readAt: string | null } | null;
}

export interface ActivityResponse {
  id: number; type: "FOLLOW" | "RATING" | "REVIEW" | "LIST" | "WATCHED"; createdAt: string;
  actor: PublicSocialUser | null; movie: { id: number; title: string } | null;
  relatedUser: { id: number; username: string; displayName: string } | null;
  list: { id: number; name: string } | null;
}

export interface PopularReviewerResponse extends PublicSocialUser {
  likes: number; reviewCount: number; watchedCount: number; listCount: number;
}
