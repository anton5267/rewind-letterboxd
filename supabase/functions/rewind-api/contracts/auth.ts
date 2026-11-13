export interface HostedAuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  username: string | null;
  updatedAt?: string;
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  role: string;
  avatarUrl: string | null;
}

export interface RewindAuthVerifier {
  verifyAccessToken(token: string): Promise<HostedAuthUser | null>;
  verifyCurrentPassword?(user: HostedAuthUser, currentPassword: string): Promise<void>;
  changePassword?(user: HostedAuthUser, currentPassword: string, newPassword: string): Promise<void>;
  requestEmailChange?(accessToken: string, email: string, language: "uk" | "en"): Promise<void>;
  processPendingIdentityDeletion?(): Promise<void>;
}

export type InternalWorkerHandler = (request: Request) => Promise<Response>;
