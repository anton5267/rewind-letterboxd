import type { ImgHTMLAttributes, ReactNode } from "react";
import ResilientImage from "../ResilientImage";
import { safeHttpUrl } from "../../utils/externalUrl";
import styles from "./JournalCover.module.css";

interface Props {
  coverUrl: string | null;
  images?: string[] | null;
  label: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallback: ReactNode;
  onLoad?: ImgHTMLAttributes<HTMLImageElement>["onLoad"];
  onError?: ImgHTMLAttributes<HTMLImageElement>["onError"];
}

export default function JournalCover(
  {
    coverUrl,
    images,
    label,
    className,
    loading = "lazy",
    fallback,
    onLoad,
    onError,
  }: Props,
) {
  const covers = (Array.isArray(images) ? images.slice(0, 3) : []).flatMap(
    (value) => {
      const url = typeof value === "string" ? safeHttpUrl(value) : null;
      return url ? [url] : [];
    },
  );
  if (covers.length < 2) {
    return (
      <ResilientImage
        className={className}
        src={covers[0] ?? coverUrl}
        alt=""
        loading={loading}
        fallback={fallback}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }
  return (
    <div
      className={`${className ?? ""} ${styles.collage}`}
      data-journal-cover={covers.length}
      role="img"
      aria-label={label}
    >
      {covers.map((url, index) => (
        <div key={`${index}:${url}`} className={styles.panel}>
          <ResilientImage
            className={styles.image}
            src={url}
            alt=""
            loading={loading}
            onLoad={index === 0 ? onLoad : undefined}
            onError={index === 0 ? onError : undefined}
            fallback={
              <span className={styles.fallback} aria-hidden="true">REWIND</span>
            }
          />
        </div>
      ))}
    </div>
  );
}
