import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { getPublicListLikeStatus, likePublicList, unlikePublicList, type PublicListLikeStatus } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface PublicList {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  likeCount: number;
  ownerUsername: string;
  tags: string[];
  movies: { id: number; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }[];
}

export default function PublicList() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const { isAuth } = useAuth();
  const [list, setList] = useState<PublicList | null>(null);
  const [likeStatus, setLikeStatus] = useState<PublicListLikeStatus | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setList(null);
    setLoading(true);
    setError(false);
    api.get<PublicList>(`/lists/public/${id}`)
      .then(({ data }) => { if (current) setList(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id, lang, attempt]);

  useEffect(() => {
    if (!isAuth || !id) {
      setLikeStatus(null);
      setLikeError(false);
      return;
    }
    let current = true;
    getPublicListLikeStatus(id)
      .then(({ data }) => { if (current) setLikeStatus(data); })
      .catch(() => { if (current) { setLikeStatus(null); setLikeError(false); } });
    return () => { current = false; };
  }, [id, isAuth, lang]);

  const toggleLike = async () => {
    if (!list || !likeStatus || likeBusy) return;
    setLikeBusy(true);
    setLikeError(false);
    try {
      if (likeStatus.liked) await unlikePublicList(list.id);
      else await likePublicList(list.id);
      const liked = !likeStatus.liked;
      setLikeStatus({ liked, likes: Math.max(0, likeStatus.likes + (liked ? 1 : -1)) });
      setList(current => current ? { ...current, likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)) } : current);
    } catch {
      setLikeError(true);
    } finally {
      setLikeBusy(false);
    }
  };

  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPublicListError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p></main>;
  if (loading || !list) return <main aria-busy="true" style={{ padding: "110px 5% 40px" }}><p role="status">{t("loading")}</p></main>;
  return <main aria-busy="false" style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <p>{t("listBy")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link></p>
    <h1>{list.name}</h1>
    {list.description && <p>{list.description}</p>}
    {list.tags.length > 0 && <p aria-label={t("tags")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(tag)}`)}>#{tag}</Link>)}
    </p>}
    <p>{t("likes")}: {list.likeCount ?? 0} {isAuth && likeStatus && <button type="button" disabled={likeBusy} aria-pressed={likeStatus.liked} onClick={() => void toggleLike()}>{likeStatus.liked ? t("unlikeList") : t("likeList")}</button>} {likeError && <span role="alert">{t("listLikeError")}</span>}</p>
    <h2>{t("films")}</h2>
    {list.movies.length === 0 ? <p>{t("emptyPublicList")}</p> : <ul>
      {list.movies.map(movie => <li key={movie.id} style={{ margin: "12px 0" }}>
        <Link to={path(`/films/${movie.id}`)}>{movie.title}</Link>{movie.releaseDate && ` (${movie.releaseDate.slice(0, 4)})`}{movie.rating !== null && ` · ★ ${movie.rating}`}
      </li>)}
    </ul>}
  </main>;
}
