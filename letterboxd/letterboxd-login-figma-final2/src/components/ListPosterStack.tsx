import type { MoviePreview } from "../api/lists.api";
import ResilientImage from "./ResilientImage";
import styles from "./ListPosterStack.module.css";

interface Props {
  movies: MoviePreview[];
  label: string;
  size?: "compact" | "featured" | "large";
}

function StackPoster({ movie }: { movie: MoviePreview }) {
  return <ResilientImage src={movie.photoUrl} alt="" fallback={<span>{movie.title}</span>} />;
}

export default function ListPosterStack({ movies, label, size = "compact" }: Props) {
  const visibleMovies = movies.slice(0, 3);

  return (
    <div className={`${styles.stack} ${size === "large" ? styles.large : size === "featured" ? styles.featured : styles.compact}`} aria-label={label} role="img">
      {visibleMovies.length === 0 ? (
        <div className={styles.emptyPoster}><span>{label}</span></div>
      ) : visibleMovies.map((movie, index) => (
        <div className={styles.poster} key={movie.id} style={{ zIndex: visibleMovies.length - index }}>
          <StackPoster movie={movie} />
        </div>
      ))}
    </div>
  );
}
