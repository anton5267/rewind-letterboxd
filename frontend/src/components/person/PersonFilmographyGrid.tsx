import { Link } from "react-router-dom";
import type { PersonFilmography } from "../../api/people.api";
import { editorialText, formatMovieYear, useLocale } from "../../i18n";
import ResilientImage from "../ResilientImage";
import styles from "../../pages/Person.module.css";

interface Props {
  id: string;
  films: PersonFilmography["films"];
  expanded: boolean;
  filmPath(id: number): string;
}

export default function PersonFilmographyGrid(
  { id, films, expanded, filmPath }: Props,
) {
  const { t } = useLocale();
  const visibleFilms = expanded ? films : films.slice(0, 12);
  return (
    <div id={id} className={styles.grid}>
      {visibleFilms.map((film) => {
        const title = editorialText(film.title, t("untitledFilm"));
        return (
          <article className={styles.filmCard} key={film.id}>
            <Link
              to={filmPath(film.id)}
              aria-label={`${title} — ${
                formatMovieYear(film.releaseDate, t("unknownYear"))
              }`}
            >
              <ResilientImage
                className={styles.poster}
                src={film.photoUrl}
                alt={`${t("poster")} ${title}`}
                fallback={
                  <div className={styles.posterFallback} aria-hidden="true">
                    {title.slice(0, 1).toUpperCase()}
                  </div>
                }
              />
              <div className={styles.filmInfo}>
                <h3 className={styles.filmTitle}>{title}</h3>
                <p className={styles.filmMeta}>
                  {formatMovieYear(film.releaseDate, t("unknownYear"))}
                  {film.characterName?.trim() &&
                    ` · ${film.characterName.trim()}`}
                  {film.rating !== null && ` · ★ ${film.rating}`}
                </p>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
