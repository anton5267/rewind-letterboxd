import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useLocale } from "../i18n";

interface Person { name: string; photoUrl: string | null; type: string; films: { id: number; title: string; releaseDate: string | null; rating: number | null; characterName: string | null }[] }
export default function Person() {
  const { type, id } = useParams();
  const { path, t, lang } = useLocale();
  const [person, setPerson] = useState<Person | null>(null);
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); api.get<Person>(`/${type}s/${id}`, { params: { sort } }).then(({ data }) => setPerson(data)).catch(() => setError(true)); }, [type, id, sort, lang]);
  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPersonError")}</p></main>;
  if (!person) return <main style={{ padding: "110px 5% 40px" }}><p>{t("loading")}</p></main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    {person.photoUrl && <img src={person.photoUrl} alt="" width="120" />}
    <h1>{person.name}</h1>
    <label>{t("sortBy")} <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option><option value="rating">{t("sortBestRated")}</option><option value="title">{t("sortTitle")}</option></select></label>
    <h2>{t("filmography")}</h2>
    {person.films.length === 0 ? <p>{t("noFilms")}</p> : <ul>{person.films.map(film => <li key={film.id}><Link to={path(`/films/${film.id}`)}>{film.title}</Link>{film.releaseDate && ` (${film.releaseDate.slice(0, 4)})`}{film.characterName && ` — ${film.characterName}`}{film.rating !== null && ` · ★ ${film.rating}`}</li>)}</ul>}
  </main>;
}
