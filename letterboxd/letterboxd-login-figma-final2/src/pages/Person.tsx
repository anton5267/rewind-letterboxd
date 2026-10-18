import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { localizeGenreName, useLocale } from "../i18n";

interface Person { name: string; photoUrl: string | null; type: string; films: { id: number; title: string; releaseDate: string | null; rating: number | null; characterName: string | null }[] }
interface Genre { id: number; name: string }
export default function Person() {
  const { type, id } = useParams();
  const { path, t, lang } = useLocale();
  const [person, setPerson] = useState<Person | null>(null);
  const [sort, setSort] = useState("newest");
  const [genreId, setGenreId] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreError, setGenreError] = useState(false);
  const [genreRetry, setGenreRetry] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setGenreError(false);
    api.get<Genre[]>("/genres")
      .then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) { setGenres([]); setGenreError(true); } });
    return () => { current = false; };
  }, [lang, genreRetry]);
  useEffect(() => {
    let current = true;
    setPerson(null);
    setError(false);
    api.get<Person>(`/${type}s/${id}`, { params: { sort, genreId: genreId || undefined } })
      .then(({ data }) => { if (current) setPerson(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [type, id, sort, genreId, lang, attempt]);
  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPersonError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p></main>;
  if (!person) return <main aria-busy="true" style={{ padding: "110px 5% 40px" }}><p role="status">{t("loading")}</p></main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    {person.photoUrl && <img src={person.photoUrl} alt="" width="120" />}
    <h1>{person.name}</h1>
    {genreError && <p role="alert">{t("loadGenresError")} <button type="button" onClick={() => setGenreRetry(value => value + 1)}>{t("retry")}</button></p>}
    <label>{t("sortBy")} <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option><option value="rating">{t("sortBestRated")}</option><option value="title">{t("sortTitle")}</option></select></label>{" "}
    <label>{t("genre")} <select value={genreId} onChange={event => setGenreId(event.target.value)}><option value="">{t("allGenres")}</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}</select></label>
    <h2>{t("filmography")}</h2>
    {person.films.length === 0 ? <p>{t("noFilms")}</p> : <ul>{person.films.map(film => <li key={film.id}><Link to={path(`/films/${film.id}`)}>{film.title}</Link>{film.releaseDate && ` (${film.releaseDate.slice(0, 4)})`}{film.characterName && ` — ${film.characterName}`}{film.rating !== null && ` · ★ ${film.rating}`}</li>)}</ul>}
  </main>;
}
