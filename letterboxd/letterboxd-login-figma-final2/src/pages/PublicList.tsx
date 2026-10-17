import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useLocale } from "../i18n";

interface PublicList {
  id: number;
  name: string;
  description: string | null;
  ownerUsername: string;
  movies: { id: number; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }[];
}

export default function PublicList() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const [list, setList] = useState<PublicList | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setList(null); setError(false);
    api.get<PublicList>(`/lists/public/${id}`).then(({ data }) => setList(data)).catch(() => setError(true));
  }, [id, lang]);

  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPublicListError")}</p></main>;
  if (!list) return <main style={{ padding: "110px 5% 40px" }}><p>{t("loading")}</p></main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <p>{t("listBy")} {list.ownerUsername}</p>
    <h1>{list.name}</h1>
    {list.description && <p>{list.description}</p>}
    <h2>{t("films")}</h2>
    {list.movies.length === 0 ? <p>{t("emptyPublicList")}</p> : <ul>
      {list.movies.map(movie => <li key={movie.id} style={{ margin: "12px 0" }}>
        <Link to={path(`/films/${movie.id}`)}>{movie.title}</Link>{movie.releaseDate && ` (${movie.releaseDate.slice(0, 4)})`}{movie.rating !== null && ` · ★ ${movie.rating}`}
      </li>)}
    </ul>}
  </main>;
}
