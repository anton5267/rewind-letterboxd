import type { RewindAuthVerifier } from "../contracts/auth.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";

export interface HttpRouteContext {
  request: Request;
  path: string;
  query: URLSearchParams;
  corsHeaders: Headers;
  repository: RewindApiRepository;
  authVerifier?: RewindAuthVerifier;
}
