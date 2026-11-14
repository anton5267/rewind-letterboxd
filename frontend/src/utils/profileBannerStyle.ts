import type { CSSProperties } from "react";
import { safeHttpUrl } from "./externalUrl";

export function profileBannerStyle(
  value: string | null | undefined,
): CSSProperties | undefined {
  const url = safeHttpUrl(value);
  return url
    ? {
      "--rewind-profile-banner": `url(${JSON.stringify(url)})`,
    } as CSSProperties
    : undefined;
}
