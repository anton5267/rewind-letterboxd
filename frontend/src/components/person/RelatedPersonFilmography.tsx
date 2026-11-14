import { useEffect, useRef, useState } from "react";
import {
  getPersonFilmography,
  type PersonFilmography,
  type PersonType,
  type RelatedPersonRole,
} from "../../api/people.api";
import type { Genre } from "../../api/search.api";
import { useLocale } from "../../i18n";
import { getFilmDecade } from "../../utils/filmDecade";
import RetryNotice from "../RetryNotice";
import PersonFilmographyFilters from "./PersonFilmographyFilters";
import PersonFilmographyGrid from "./PersonFilmographyGrid";
import PersonLoading from "./PersonLoading";
import styles from "../../pages/Person.module.css";

interface Props {
  id: string;
  person: RelatedPersonRole;
  title: string;
  genres: Genre[];
  genresUnavailable: boolean;
  filtersOpen: boolean;
  filmPath(id: number): string;
}

export default function RelatedPersonFilmography(props: Props) {
  const { t, lang } = useLocale();
  const [films, setFilms] = useState<PersonFilmography["films"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sort, setSort] = useState("newest");
  const [genreId, setGenreId] = useState("");
  const [decade, setDecade] = useState("");
  const [expanded, setExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const section = useRef<HTMLElement>(null);
  const retryFocus = useRef<{ origin: Element | null } | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setFilms(null);
    getPersonFilmography(
      props.person.type.toLowerCase() as PersonType,
      props.person.id,
      sort,
      genreId,
      lang,
    )
      .then(({ data }) => {
        if (current) setFilms(data.films);
      })
      .catch(() => {
        if (current) setError(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [props.person.id, props.person.type, sort, genreId, lang, attempt]);

  useEffect(() => {
    setExpanded(false);
  }, [sort, genreId, decade, lang]);

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (
        document.activeElement !== document.body &&
        document.activeElement !== pending.origin
      ) return;
      if (error) {
        section.current?.querySelector<HTMLButtonElement>("[data-retry-button]")
          ?.focus();
      } else heading.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error]);

  const matchingFilms = (films ?? []).filter((film) =>
    decade === "" || getFilmDecade(film.releaseDate) === Number(decade)
  );
  const gridId = `${props.id}-grid`;
  return (
    <section
      ref={section}
      className={`${styles.content} ${styles.relatedContent}`}
      aria-labelledby={`${props.id}-title`}
      aria-busy={loading}
    >
      <div className={styles.filmographyHeader}>
        <div className={styles.sectionHeading}>
          <h2 id={`${props.id}-title`} ref={heading} tabIndex={-1}>
            {props.title}
          </h2>
        </div>
        <PersonFilmographyFilters
          id={`${props.id}-filters`}
          films={films ?? []}
          genres={props.genres}
          genresUnavailable={props.genresUnavailable}
          open={props.filtersOpen}
          sort={sort}
          genreId={genreId}
          decade={decade}
          onSortChange={setSort}
          onGenreChange={setGenreId}
          onDecadeChange={setDecade}
        />
      </div>
      {loading && <PersonLoading />}
      {error && (
        <RetryNotice
          className={styles.error}
          message={t("loadPersonError")}
          retryLabel={t("retry")}
          onRetry={() => {
            retryFocus.current = { origin: document.activeElement };
            setLoading(true);
            setAttempt((value) => value + 1);
          }}
        />
      )}
      {!loading && !error && (matchingFilms.length === 0
        ? (
          <div className={styles.empty}>
            <p>{t("noFilms")}</p>
            {(genreId || decade) && (
              <button
                type="button"
                onClick={() => {
                  setGenreId("");
                  setDecade("");
                  heading.current?.focus();
                }}
              >
                {t("personResetFilters")}
              </button>
            )}
          </div>
        )
        : (
          <PersonFilmographyGrid
            id={gridId}
            films={matchingFilms}
            expanded={expanded}
            filmPath={props.filmPath}
          />
        ))}
      {!loading && !error && matchingFilms.length > 12 && (
        <button
          type="button"
          className={styles.expandFilms}
          aria-expanded={expanded}
          aria-controls={gridId}
          onClick={() => {
            setExpanded((value) => !value);
            if (expanded) {
              heading.current?.focus();
            }
          }}
        >
          {t(expanded ? "personShowFewerFilms" : "personShowAllFilms")}
        </button>
      )}
    </section>
  );
}
