import api from "./axios";

export type ProfileMediaKind = "avatar" | "banner";
export interface ProfileMediaResponse {
  avatarUrl: string | null;
  bannerUrl: string | null;
}

export const uploadProfileMedia = (
  kind: ProfileMediaKind,
  image: Blob,
  expectedUserId: number,
) =>
  api.post<ProfileMediaResponse>(`/profile/me/media/${kind}`, image, {
    params: { expectedUserId },
    headers: { "Content-Type": image.type },
    timeout: 45000,
  });

export const removeProfileMedia = (
  kind: ProfileMediaKind,
  expectedUserId: number,
) =>
  api.delete<ProfileMediaResponse>(`/profile/me/media/${kind}`, {
    params: { expectedUserId },
    timeout: 30000,
  });
