import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPersonFilmography, type PersonFilmography, type PersonType } from "../api/people.api";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { getGenres, type Genre } from "../api/search.api";
import { editorialText, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
import styles from "./Person.module.css";
import filterIcon from "../assets/figma/home-person/person-filter.png";

function PersonLoading({ identity = false }: { identity?: boolean }) {
  const { t } = useLocale();
  const posters = <div className={styles.grid} aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span className={`${styles.poster} ${styles.skeleton}`} key={index} />)}</div>;
  return <div role="status" aria-label={t("loading")}><span className="srOnly">{t("loading")}</span>{identity ? <><section className={styles.hero} aria-hidden="true"><div className={styles.mobileToolbar} /><div className={styles.heroIdentity}><span className={`${styles.avatarFallback} ${styles.skeleton}`} /><span className={`${styles.skeletonTitle} ${styles.skeleton}`} /></div></section><section className={styles.content}>{posters}</section></> : posters}</div>;
}

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
  const [allFilms, setAllFilms] = useState(false);
  const filterButton = useRef<HTMLButtonElement>(null);
  const personHeadingRef = useRef<HTMLHeadingElement>(null);
  const filmographyHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusPersonAfterRetry = useRef<{ origin: Element | null } | null>(null);
  const focusGenresAfterRetry = useRef<{ origin: Element | null } | null>(null);

  useEffect(() => {
    focusPersonAfterRetry.current = null;
    focusGenresAfterRetry.current = null;
    setAllFilms(false);
  }, [type, personId, lang, sort, genreId]);

  useEffect(() => {
    const pending = focusPersonAfterRetry.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (focusPersonAfterRetry.current !== pending) return;
      focusPersonAfterRetry.current = null;
      if (document.activeElement === document.body || document.activeElement === pending.origin) personHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, person]);

  useEffect(() => {
    const pending = focusGenresAfterRetry.current;
    if (!pending || genresLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (focusGenresAfterRetry.current !== pending) return;
      focusGenresAfterRetry.current = null;
      if (document.activeElement === document.body || document.activeElement === pending.origin) filmographyHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [genresLoading, genreError, genres]);

  const retryPerson = () => {
    focusPersonAfterRetry.current = { origin: document.activeElement };
    setAttempt(value => value + 1);
  };
  const retryGenres = () => {
    focusGenresAfterRetry.current = { origin: document.activeElement };
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
  if (!person || !personMatchesRoute) return <main className={`${styles.page} ${error ? styles.statePage : ""} ${type === "director" ? styles.directorPage : ""}`} aria-labelledby="person-title" aria-busy={loading && !error}><div className={styles.stateBack}><Link className={styles.mobileBack} to={path("/search")} aria-label={t("search")}><img src="/images/help-icon-back.png" alt="" /></Link></div><h1 id="person-title" className={error ? styles.stateTitle : "srOnly"} ref={personHeadingRef} tabIndex={-1}>{t("filmography")}</h1>{error ? <p className={styles.error} role="alert">{!validPersonType || !validPersonId ? t("invalidPersonId") : t("loadPersonError")} {validPersonType && validPersonId && <RetryButton label={t("retry")} busy={loading} onClick={retryPerson} />}</p> : <PersonLoading identity />}</main>;

  const personName = editorialText(person.name, t("unknownPerson"));
  const personTypeLabel = type === "actor" ? t("actors") : type === "producer" ? t("producers") : t("directors");
  const filmSectionTitle = type === "actor" ? t("filmsStarring") : type === "director" ? t("filmsDirected") : t("filmography");

  return <main className={`${styles.page} ${type === "director" ? styles.directorPage : ""}`} aria-labelledby="person-title" aria-busy={loading || genresLoading}>
    <section className={styles.hero}>
      <div className={styles.mobileToolbar}>
        <Link className={styles.mobileBack} to={path("/search")} aria-label={t("search")}><img src="/images/help-icon-back.png" alt="" /></Link>
        <span>{t("filmography")}</span>
        <button ref={filterButton} className={styles.mobileSearch} type="button" aria-label={t("filters")} aria-expanded={filtersOpen} aria-controls="person-filters" onClick={() => setFiltersOpen(value => !value)}><img src={filterIcon} alt="" /></button>
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
      {error && <RetryNotice className={styles.error} message={t("loadPersonError")} retryLabel={t("retry")} onRetry={retryPerson} />}
      {genreError && <RetryNotice className={styles.error} message={t("loadGenresError")} retryLabel={t("retry")} onRetry={retryGenres} />}
      <div className={styles.filmographyHeader}>
      <div className={styles.sectionHeading}><h2 id="filmography-title" ref={filmographyHeadingRef} tabIndex={-1}>{filmSectionTitle}</h2></div>
      <div id="person-filters" className={`${styles.controls} ${filtersOpen ? styles.controlsOpen : ""}`} onKeyDown={event => { if (event.key === "Escape" && filtersOpen) { event.preventDefault(); setFiltersOpen(false); filterButton.current?.focus(); } }}>
        <label className={styles.field}>{t("sortBy")} <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option><option value="rating">{t("sortBestRated")}</option><option value="title">{t("sortTitle")}</option></select></label>
        <label className={styles.field}>{t("genre")} <select value={genreId} disabled={genresLoading || genreError} onChange={event => setGenreId(event.target.value)}><option value="">{t("allGenres")}</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}</select></label>
      </div>
      </div>
      {loading ? <PersonLoading /> : !error && (person.films.length === 0 ? <div className={styles.empty}><p>{t("noFilms")}</p>{genreId && <button type="button" onClick={() => { setGenreId(""); filmographyHeadingRef.current?.focus(); }}>{t("allGenres")}</button>}</div> : <div id="person-films" className={styles.grid}>{(allFilms ? person.films : person.films.slice(0, 12)).map(film => {
        const filmTitle = editorialText(film.title, t("untitledFilm"));
        return <article className={styles.filmCard} key={film.id}>
          <Link to={path(`/films/${film.id}`)} aria-label={`${filmTitle} — ${formatMovieYear(film.releaseDate, t("unknownYear"))}`}>
            <ResilientImage className={styles.poster} src={film.photoUrl} alt={`${t("poster")} ${filmTitle}`} fallback={<div className={styles.posterFallback} aria-hidden="true">{filmTitle.slice(0, 1).toUpperCase()}</div>} />
            <div className={styles.filmInfo}>
              <h3 className={styles.filmTitle}>{filmTitle}</h3>
              <p className={styles.filmMeta}>{formatMovieYear(film.releaseDate, t("unknownYear"))}{film.characterName?.trim() && ` · ${film.characterName.trim()}`}{film.rating !== null && ` · ★ ${film.rating}`}</p>
            </div>
          </Link>
        </article>;
      })}</div>)}
      {!loading && !error && person.films.length > 12 && <button type="button" className={styles.expandFilms} aria-expanded={allFilms} aria-controls="person-films" onClick={() => { setAllFilms(value => !value); if (allFilms) filmographyHeadingRef.current?.focus(); }}>{t(allFilms ? "personShowFewerFilms" : "personShowAllFilms")}</button>}
    </section>
  </main>;
}
