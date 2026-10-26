import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPersonFilmography, type PersonFilmography, type PersonType } from "../api/people.api";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { getGenres, type Genre } from "../api/search.api";
import { editorialText, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
import styles from "./Person.module.css";

export default function Person() {
  const { type, id } = useParams();
  const { path, t, lang } = useLocale();
  const personId = Number(id);
  const validPersonId = Number.isSafeInteger(personId) && personId > 0;
  const validPersonType = type === "actor" || type === "director" || type === "producer";
  const [person, setPerson] = useState<PersonFilmography | null>(null);
  const [sort, setSort] = useState("newest");
  const [genreId, setGenreId] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genreError, setGenreError] = useState(false);
  const [genreRetry, setGenreRetry] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const personHeadingRef = useRef<HTMLHeadingElement>(null);
  const filmographyHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusPersonAfterRetry = useRef(false);
  const focusGenresAfterRetry = useRef(false);

  useEffect(() => {
    focusPersonAfterRetry.current = false;
    focusGenresAfterRetry.current = false;
  }, [type, personId, lang]);

  useEffect(() => {
    if (!focusPersonAfterRetry.current || loading) return;
    focusPersonAfterRetry.current = false;
    const frame = window.requestAnimationFrame(() => personHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, person]);

  useEffect(() => {
    if (!focusGenresAfterRetry.current || genresLoading) return;
    focusGenresAfterRetry.current = false;
    const frame = window.requestAnimationFrame(() => filmographyHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [genresLoading, genreError, genres]);

  const retryPerson = () => {
    focusPersonAfterRetry.current = true;
    setAttempt(value => value + 1);
  };
  const retryGenres = () => {
    focusGenresAfterRetry.current = true;
    setGenreRetry(value => value + 1);
  };
  useEffect(() => {
    let current = true;
    if (!validPersonType || !validPersonId) {
      setGenres([]);
      setGenresLoading(false);
      setGenreError(false);
      return () => { current = false; };
    }
    setGenresLoading(true);
    setGenreError(false);
    getGenres()
      .then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) { setGenres([]); setGenreError(true); } })
      .finally(() => { if (current) setGenresLoading(false); });
    return () => { current = false; };
  }, [lang, genreRetry, validPersonId, validPersonType]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    if (!validPersonType || !validPersonId) {
      setPerson(null);
      setError(true);
      setLoading(false);
      return;
    }
    getPersonFilmography(type as PersonType, personId, sort, genreId)
      .then(({ data }) => { if (current) setPerson(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [type, personId, validPersonId, validPersonType, sort, genreId, lang, attempt]);
  const personMatchesRoute = person !== null
    && person.id === personId
    && person.type.toLowerCase() === type;
  if (!person || !personMatchesRoute) return <main className={`${styles.page} ${styles.statePage}`} aria-labelledby="person-title" aria-busy={loading && !error}><h1 id="person-title" className={styles.stateTitle} ref={personHeadingRef} tabIndex={-1}>{t("filmography")}</h1>{error ? <p className={styles.error} role="alert">{!validPersonType || !validPersonId ? t("invalidPersonId") : t("loadPersonError")} {validPersonType && validPersonId && <RetryButton label={t("retry")} busy={loading} onClick={retryPerson} />}</p> : <p className={styles.status} role="status">{t("loading")}</p>}</main>;

  const personName = editorialText(person.name, t("unknownPerson"));
  const personTypeLabel = type === "actor" ? t("actors") : type === "producer" ? t("producers") : t("directors");
  const filmSectionTitle = type === "actor" ? t("filmsStarring") : type === "director" ? t("filmsDirected") : t("filmography");

  return <main className={styles.page} aria-labelledby="person-title" aria-busy={loading || genresLoading}>
    <section className={styles.hero}>
      <div className={styles.mobileToolbar}>
        <Link className={styles.mobileBack} to={path("/search")} aria-label={t("search")}>←</Link>
        <span>{t("filmography")}</span>
        <button className={styles.mobileSearch} type="button" aria-label={t("filters")} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}><i className="fa-solid fa-sliders" aria-hidden="true" /></button>
      </div>
      <div className={styles.heroIdentity}>
        <ResilientImage className={styles.avatar} src={person.photoUrl} alt={personName} fallback={<div className={styles.avatarFallback} aria-hidden="true">{personName.slice(0, 1).toUpperCase()}</div>} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{personTypeLabel}</p>
          <h1 id="person-title" ref={personHeadingRef} tabIndex={-1}>{personName}</h1>
          <p className={styles.heroMeta}>{t("filmography")}</p>
        </div>
      </div>
    </section>

    <section className={styles.content} aria-labelledby="filmography-title" aria-busy={loading || genresLoading}>
      {loading && <p className={styles.status} role="status">{t("loading")}</p>}
      {error && <RetryNotice className={styles.error} message={t("loadPersonError")} retryLabel={t("retry")} onRetry={retryPerson} />}
      {genreError && <RetryNotice className={styles.error} message={t("loadGenresError")} retryLabel={t("retry")} onRetry={retryGenres} />}
      <div className={`${styles.controls} ${filtersOpen ? styles.controlsOpen : ""}`}>
        <label className={styles.field}>{t("sortBy")} <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option><option value="rating">{t("sortBestRated")}</option><option value="title">{t("sortTitle")}</option></select></label>
        <label className={styles.field}>{t("genre")} <select value={genreId} disabled={genresLoading || genreError} onChange={event => setGenreId(event.target.value)}><option value="">{t("allGenres")}</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}</select></label>
      </div>
      <div className={styles.sectionHeading}><h2 id="filmography-title" ref={filmographyHeadingRef} tabIndex={-1}>{filmSectionTitle}</h2></div>
      {person.films.length === 0 ? <p className={styles.empty}>{t("noFilms")}</p> : <div className={styles.grid}>{person.films.map(film => {
        const filmTitle = editorialText(film.title, t("untitledFilm"));
        return <article className={styles.filmCard} key={film.id}>
          <Link to={path(`/films/${film.id}`)}>
            <ResilientImage className={styles.poster} src={film.photoUrl} alt={`${t("poster")} ${filmTitle}`} fallback={<div className={styles.posterFallback}>{filmTitle}</div>} />
            <div className={styles.filmInfo}>
              <h3 className={styles.filmTitle}>{filmTitle}</h3>
              <p className={styles.filmMeta}>{formatMovieYear(film.releaseDate, t("unknownYear"))}{film.characterName?.trim() && ` · ${film.characterName.trim()}`}{film.rating !== null && ` · ★ ${film.rating}`}</p>
            </div>
          </Link>
        </article>;
      })}</div>}
    </section>
  </main>;
}
