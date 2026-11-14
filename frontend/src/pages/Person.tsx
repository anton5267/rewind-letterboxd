import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getPersonFilmography, type PersonFilmography, type PersonType } from "../api/people.api";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import PersonFilmographyFilters from "../components/person/PersonFilmographyFilters";
import PersonFilmographyGrid from "../components/person/PersonFilmographyGrid";
import PersonLoading from "../components/person/PersonLoading";
import RelatedPersonFilmography from "../components/person/RelatedPersonFilmography";
import { getGenres, type Genre } from "../api/search.api";
import { editorialText, useLocale } from "../i18n";
import styles from "./Person.module.css";
import filterIcon from "../assets/figma/home-person/person-filter.png";
import { setPublicCatalogMetadata } from "../utils/publicCatalogSeo";
import { getFilmDecade } from "../utils/filmDecade";

const publicCatalogOnly = import.meta.env.VITE_PUBLIC_CATALOG_ONLY === "true";

export default function Person() {
  const { type, id } = useParams();
  const location = useLocation();
  const { path, t, lang } = useLocale();
  const backPath = publicCatalogOnly ? `/${lang}/home/` : path("/search");
  const filmPath = (filmId: number) => publicCatalogOnly ? `/${lang}/films/${filmId}/` : path(`/films/${filmId}`);
  const personId = Number(id);
  const validPersonId = Number.isSafeInteger(personId) && personId > 0;
  const validPersonType = type === "actor" || type === "director" || type === "producer";
  const [person, setPerson] = useState<PersonFilmography | null>(null);
  const [sort, setSort] = useState("newest");
  const [genreId, setGenreId] = useState("");
  const [decade, setDecade] = useState("");
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
  }, [type, personId, lang, sort, genreId, decade]);

  useEffect(() => { setDecade(""); }, [type, personId]);

  useEffect(() => {
    const pending = focusPersonAfterRetry.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (focusPersonAfterRetry.current !== pending) return;
      focusPersonAfterRetry.current = null;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (error) {
        personHeadingRef.current?.closest("main")?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
        return;
      }
      personHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, person]);

  useEffect(() => {
    const pending = focusGenresAfterRetry.current;
    if (!pending || genresLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (focusGenresAfterRetry.current !== pending) return;
      focusGenresAfterRetry.current = null;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (genreError) {
        filmographyHeadingRef.current?.closest("section")?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
        return;
      }
      filmographyHeadingRef.current?.focus();
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
  const personName = person && personMatchesRoute ? editorialText(person.name, t("unknownPerson")) : t("filmography");
  useEffect(() => {
    if (!publicCatalogOnly) return;
    const role = type === "director"
      ? (lang === "uk" ? "режисера" : "director")
      : type === "producer"
      ? (lang === "uk" ? "продюсера" : "producer")
      : (lang === "uk" ? "актора" : "actor");
    setPublicCatalogMetadata({
      language: lang,
      title: personName,
      description: lang === "uk"
        ? `Фільмографія ${role} ${personName} у публічному каталозі REWIND.`
        : `${personName}'s ${role} filmography in the public REWIND catalogue.`,
      imageUrl: person && personMatchesRoute ? person.photoUrl : null,
    });
  }, [lang, location.pathname, person?.photoUrl, personMatchesRoute, personName, type]);
  if (!person || !personMatchesRoute) return <main className={`${styles.page} ${error ? styles.statePage : ""} ${type === "director" ? styles.directorPage : ""}`} aria-labelledby="person-title" aria-busy={loading && !error}><div className={styles.stateBack}><Link className={styles.mobileBack} to={backPath} aria-label={t("search")}><img src="/images/help-icon-back.png" alt="" /></Link></div><h1 id="person-title" className={error ? styles.stateTitle : "srOnly"} ref={personHeadingRef} tabIndex={-1}>{t("filmography")}</h1>{error ? <p className={styles.error} role="alert">{!validPersonType || !validPersonId ? t("invalidPersonId") : t("loadPersonError")} {validPersonType && validPersonId && <RetryButton label={t("retry")} busy={loading} onClick={retryPerson} />}</p> : <PersonLoading identity />}</main>;

  const relatedPeople = person.relatedPeople ?? [];
  const roleLabels = { ACTOR: t("personActorRole"), DIRECTOR: t("personDirectorRole"), PRODUCER: t("personProducerRole") };
  const sectionTitles = { ACTOR: t("filmsStarring"), DIRECTOR: t("filmsDirected"), PRODUCER: t("filmsProduced") };
  const personTypeLabel = [person.type, ...relatedPeople.map(related => related.type)].map(role => roleLabels[role]).join(" · ");
  const filmSectionTitle = sectionTitles[person.type];
  const relatedSectionIds = relatedPeople.map(related => `person-${related.type.toLowerCase()}-${related.id}`);
  const films = decade === ""
    ? person.films
    : person.films.filter(film => getFilmDecade(film.releaseDate) === Number(decade));

  return <main className={`${styles.page} ${type === "director" ? styles.directorPage : ""}`} aria-labelledby="person-title" aria-busy={loading || genresLoading} onKeyDown={event => { if (event.key === "Escape" && filtersOpen) { event.preventDefault(); setFiltersOpen(false); filterButton.current?.focus(); } }}>
    <section className={styles.hero}>
      <div className={styles.mobileToolbar}>
        <Link className={styles.mobileBack} to={backPath} aria-label={t("search")}><img src="/images/help-icon-back.png" alt="" /></Link>
        <span>{t("filmography")}</span>
        <button ref={filterButton} className={styles.mobileSearch} type="button" aria-label={t("filters")} aria-expanded={filtersOpen} aria-controls={["person-filters", ...relatedSectionIds.map(id => `${id}-filters`)].join(" ")} onClick={() => setFiltersOpen(value => !value)}><img src={filterIcon} alt="" /></button>
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
      <PersonFilmographyFilters films={person.films} genres={genres} genresUnavailable={genresLoading || genreError}
        open={filtersOpen} sort={sort} genreId={genreId} decade={decade}
        onSortChange={setSort} onGenreChange={setGenreId} onDecadeChange={setDecade} />
      </div>
      {loading ? <PersonLoading /> : !error && (films.length === 0 ? <div className={styles.empty}><p>{t("noFilms")}</p>{(genreId || decade) && <button type="button" onClick={() => { setGenreId(""); setDecade(""); filmographyHeadingRef.current?.focus(); }}>{t("personResetFilters")}</button>}</div> : <PersonFilmographyGrid id="person-films" films={films} expanded={allFilms} filmPath={filmPath} />)}
      {!loading && !error && films.length > 12 && <button type="button" className={styles.expandFilms} aria-expanded={allFilms} aria-controls="person-films" onClick={() => { setAllFilms(value => !value); if (allFilms) filmographyHeadingRef.current?.focus(); }}>{t(allFilms ? "personShowFewerFilms" : "personShowAllFilms")}</button>}
    </section>
    {relatedPeople.map((related, index) => <RelatedPersonFilmography key={relatedSectionIds[index]} id={relatedSectionIds[index]} person={related}
      title={sectionTitles[related.type]} genres={genres} genresUnavailable={genresLoading || genreError} filtersOpen={filtersOpen} filmPath={filmPath} />)}
  </main>;
}
