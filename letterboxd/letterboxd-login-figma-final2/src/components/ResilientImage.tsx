import { useState } from "react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { safeHttpUrl } from "../utils/externalUrl";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback: ReactNode;
}

/**
 * Keeps a poster/card surface usable when an external image URL is missing
 * or returns an error. The failed URL is tracked so a later data refresh can
 * still display a new URL without remounting the whole card.
 */
export default function ResilientImage({ src, fallback, onError, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const safeSource = safeHttpUrl(src);

  if (!safeSource || failedSource === safeSource) return <>{fallback}</>;

  return (
    <img
      {...props}
      src={safeSource}
      onError={event => {
        setFailedSource(safeSource);
        onError?.(event);
      }}
    />
  );
}
