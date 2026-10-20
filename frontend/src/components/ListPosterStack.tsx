import type { MoviePreview } from "../api/lists.api";
import type { CSSProperties } from "react";
import ResilientImage from "./ResilientImage";
import styles from "./ListPosterStack.module.css";

interface Props {
  movies: MoviePreview[];
  label: string;
  fallbackTitle: string;
  size?: "compact" | "featured" | "large";
  layout?: "fan" | "strip" | "catalog";
}

function StackPoster({ movie, fallbackTitle }: { movie: MoviePreview; fallbackTitle: string }) {
  return <ResilientImage src={movie.photoUrl} alt="" fallback={<span>{movie.title?.trim() || fallbackTitle}</span>} />;
}

export default function ListPosterStack({ movies, label, fallbackTitle, size = "compact", layout = "fan" }: Props) {
  const visibleMovies = movies.slice(0, layout === "catalog" ? 5 : layout === "strip" ? 4 : 3);
  const count = Math.max(1, visibleMovies.length);
  const stripStyle = layout === "strip" ? {
    "--poster-width": `${300 / (2 * count + 1)}%`,
    "--poster-overlap": `${-100 / (2 * count + 1)}%`,
  } as CSSProperties : undefined;
  const catalogStyle = layout === "catalog" ? {
    ...stripStyle,
    "--catalog-width-factor": (79 + (count - 1) * 61) / 116,
  } as CSSProperties : stripStyle;

  return (
    <div className={`${styles.stack} ${layout === "catalog" ? styles.catalog : layout === "strip" ? styles.strip : size === "large" ? styles.large : size === "featured" ? styles.featured : styles.compact}`} style={catalogStyle} aria-label={label} role="img">
      {visibleMovies.length === 0 ? (
        <div className={styles.emptyPoster}><span>{label}</span></div>
      ) : visibleMovies.map((movie, index) => (
        <div className={styles.poster} key={movie.id} style={{ zIndex: visibleMovies.length - index, ...(layout === "catalog" ? { "--catalog-position": `${index * 100 / Math.max(1, count - 1)}%` } : {}) } as CSSProperties}>
          <StackPoster movie={movie} fallbackTitle={fallbackTitle} />
        </div>
      ))}
    </div>
  );
}
