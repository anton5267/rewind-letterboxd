export type ProfileMediaKind = "avatar" | "banner";

export interface ProfileMediaUpload {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png";
  extension: "jpg" | "png";
  width: number;
  height: number;
}

export interface ProfileMediaResponse {
  avatarUrl: string | null;
  bannerUrl: string | null;
}
