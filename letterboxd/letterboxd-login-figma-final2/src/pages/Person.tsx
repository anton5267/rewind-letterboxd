import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPersonFilmography, type PersonFilmography, type PersonType } from "../api/people.api";
import ResilientImage from "../components/ResilientImage";
import { getGenres, type Genre } from "../api/search.api";
import { editorialText, localizeGenreName, useLocale } from "../i18n";
import styles from "./Person.module.css";

export default function Person() {
  const { type, id } = useParams();
  const { path, t, lang } = useLocale();
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
  useEffect(() => {
    let current = true;
    setGenresLoading(true);
    setGenreError(false);
    getGenres()
      .then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) { setGenres([]); setGenreError(true); } })
      .finally(() => { if (current) setGenresLoading(false); });
    return () => { current = false; };
  }, [lang, genreRetry]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    if (!type || !id || !["actor", "director", "producer"].includes(type)) {
      setError(true);
      setLoading(false);
      return;
    }
    getPersonFilmography(type as PersonType, id, sort, genreId)
      .then(({ data }) => { if (current) setPerson(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [type, id, sort, genreId, lang, attempt]);
  if (!person) return <main className={styles.page} aria-busy={true}><h1 className={styles.stateTitle}>{t("filmography")}</h1>{error ? <p className={styles.error} role="alert">{t("loadPersonError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p> : <p className={styles.status} role="status">{t("loading")}</p>}</main>;

  const personName = editorialText(person.name, t("unknownPerson"));
  const personTypeLabel = type === "actor" ? t("actors") : type === "producer" ? t("producers") : t("directors");

  return <main className={styles.page} aria-busy={loading || genresLoading}>
    <section className={styles.hero}>
      <ResilientImage className={styles.avatar} src={person.photoUrl} alt={personName} fallback={<div className={styles.avatarFallback} aria-hidden="true">{personName.slice(0, 1).toUpperCase()}</div>} />
      <div>
        <p className={styles.eyebrow}>{personTypeLabel}</p>
        <h1>{personName}</h1>
        <p className={styles.heroMeta}>{t("filmography")}</p>
      </div>
    </section>

    <section className={styles.content} aria-labelledby="filmography-title" aria-busy={loading || genresLoading}>
      {loading && <p className={styles.status} role="status">{t("loading")}</p>}
      {error && <p className={styles.error} role="alert">{t("loadPersonError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {genreError && <p className={styles.error} role="alert">{t("loadGenresError")} <button type="button" onClick={() => setGenreRetry(value => value + 1)}>{t("retry")}</button></p>}
      <div className={styles.controls}>
        <label className={styles.field}>{t("sortBy")} <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option><option value="rating">{t("sortBestRated")}</option><option value="title">{t("sortTitle")}</option></select></label>
        <label className={styles.field}>{t("genre")} <select value={genreId} disabled={genresLoading || genreError} onChange={event => setGenreId(event.target.value)}><option value="">{t("allGenres")}</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}</select></label>
      </div>
      <div className={styles.sectionHeading}><h2 id="filmography-title">{t("filmography")}</h2></div>
      {person.films.length === 0 ? <p className={styles.empty}>{t("noFilms")}</p> : <div className={styles.grid}>{person.films.map(film => {
        const filmTitle = editorialText(film.title, t("untitledFilm"));
        return <article className={styles.filmCard} key={film.id}>
          <Link to={path(`/films/${film.id}`)}>
            <ResilientImage className={styles.poster} src={film.photoUrl} alt={`${t("poster")} ${filmTitle}`} fallback={<div className={styles.posterFallback}>{filmTitle}</div>} />
            <div className={styles.filmInfo}>
              <h3 className={styles.filmTitle}>{filmTitle}</h3>
              <p className={styles.filmMeta}>{film.releaseDate?.slice(0, 4) ?? t("unknownYear")}{film.characterName?.trim() && ` · ${film.characterName.trim()}`}{film.rating !== null && ` · ★ ${film.rating}`}</p>
            </div>
          </Link>
        </article>;
      })}</div>}
    </section>
  </main>;
}
