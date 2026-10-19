import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicList, getPublicListLikeStatus, likePublicList, unlikePublicList, type MoviePreview, type PublicListDetails, type PublicListLikeStatus } from "../api/lists.api";
import ResilientImage from "../components/ResilientImage";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import { toTagSlug } from "../utils/tagSlug";
import styles from "./PublicList.module.css";

function MoviePoster({ movie }: { movie: MoviePreview }) {
  return <ResilientImage className={styles.moviePoster} src={movie.photoUrl} alt="" fallback={<div className={styles.moviePosterFallback}>{movie.title}</div>} />;
}

export default function PublicList() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const { isAuth } = useAuth();
  const [list, setList] = useState<PublicListDetails | null>(null);
  const [likeStatus, setLikeStatus] = useState<PublicListLikeStatus | null>(null);
  const [likeStatusLoading, setLikeStatusLoading] = useState(false);
  const [likeStatusLoadError, setLikeStatusLoadError] = useState(false);
  const [likeStatusAttempt, setLikeStatusAttempt] = useState(0);
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
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }
    getPublicList(id)
      .then(({ data }) => { if (current) setList(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id, lang, attempt]);

  useEffect(() => {
    if (!isAuth || !id) {
      setLikeStatus(null);
      setLikeStatusLoading(false);
      setLikeStatusLoadError(false);
      setLikeError(false);
      return;
    }
    let current = true;
    setLikeStatusLoading(true);
    setLikeStatus(null);
    setLikeStatusLoadError(false);
    setLikeError(false);
    getPublicListLikeStatus(id)
      .then(({ data }) => { if (current) setLikeStatus(data); })
      .catch(() => {
        if (!current) return;
        setLikeStatus(null);
        setLikeStatusLoadError(true);
      })
      .finally(() => { if (current) setLikeStatusLoading(false); });
    return () => { current = false; };
  }, [id, isAuth, lang, likeStatusAttempt]);

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

  if (error) return <main className={styles.statePage}><p role="alert">{t("loadPublicListError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p></main>;
  if (loading || !list) return <main className={styles.statePage} aria-busy={true}><p role="status">{t("loading")}</p></main>;

  const heroImage = list.movies.find(movie => movie.photoUrl)?.photoUrl;

  return <main className={styles.page} aria-busy={likeStatusLoading || likeBusy}>
    <section className={styles.hero} aria-labelledby="public-list-heading">
      <ResilientImage className={styles.heroBackdrop} src={heroImage} alt="" aria-hidden="true" loading="eager" fallback={null} />
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>{t("listEyebrow")}</p>
        <p className={styles.ownerLine}>{t("listBy")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link></p>
        <h1 id="public-list-heading">{list.name}</h1>
        {list.description && <p className={styles.description}>{list.description}</p>}
        {list.tags.length > 0 && <div className={styles.tags} aria-label={t("tags")}>
          {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
        </div>}
        <div className={styles.heroActions}>
          <span className={styles.likeCount}>{list.likeCount ?? 0} {t("likes").toLocaleLowerCase()}</span>
          {isAuth && likeStatusLoading && <span className={styles.inlineStatus} role="status">{t("loading")}</span>}
          {isAuth && likeStatusLoadError && <span className={styles.inlineError} role="alert">{t("listLikeError")} <button type="button" onClick={() => setLikeStatusAttempt(value => value + 1)}>{t("retry")}</button></span>}
          {isAuth && likeStatus && <button type="button" disabled={likeBusy} aria-busy={likeBusy} aria-pressed={likeStatus.liked} onClick={() => void toggleLike()}>{likeBusy ? t("loading") : likeStatus.liked ? t("unlikeList") : t("likeList")}</button>}
          {likeError && <span className={styles.inlineError} role="alert">{t("listLikeError")} <button type="button" disabled={likeBusy || likeStatusLoading} aria-busy={likeBusy} onClick={() => void toggleLike()}>{t("retry")}</button></span>}
        </div>
      </div>
    </section>

    <section className={styles.content} aria-labelledby="public-list-films-heading">
      <div className={styles.sectionHeading}>
        <h2 id="public-list-films-heading">{t("films")}</h2>
        <span>{list.movies.length}</span>
      </div>
      {list.movies.length === 0 ? <p className={styles.empty}>{t("emptyPublicList")}</p> : <div className={styles.movieGrid}>
        {list.movies.map((movie, index) => <article className={styles.movieCard} key={movie.id}>
          <Link className={styles.movieMedia} to={path(`/films/${movie.id}`)} aria-label={`${movie.title} ${t("poster")}`}>
            <span className={styles.movieRank} aria-hidden="true">{index + 1}</span>
            <MoviePoster movie={movie} />
          </Link>
          <h3><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link></h3>
          <p>{movie.releaseDate?.slice(0, 4) ?? "—"}{movie.rating !== null && <> · ★ {movie.rating}</>}</p>
        </article>)}
      </div>}
    </section>
  </main>;
}
