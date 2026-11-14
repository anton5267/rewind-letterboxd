import type { RewindAuthVerifier } from "../contracts/auth.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import type { PersonBiographyProvider } from "../contracts/catalog.ts";

export interface HttpRouteContext {
  request: Request;
  path: string;
  query: URLSearchParams;
  corsHeaders: Headers;
  repository: RewindApiRepository;
  authVerifier?: RewindAuthVerifier;
  personBiographyProvider?: PersonBiographyProvider;
}
