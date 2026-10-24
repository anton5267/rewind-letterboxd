import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getListItems, type UserListItem } from "../api/lists.api";
import type { ProfileList } from "../api/profile.api";
import { editorialText, formatMovieCount, useLocale } from "../i18n";
import ListPosterStack from "./ListPosterStack";
import RetryNotice from "./RetryNotice";
import { toTagSlug } from "../utils/tagSlug";
import styles from "./ProfileListCard.module.css";

export default function ProfileListCard({ list, ownerId, enabled, description, tags }: { list: ProfileList; ownerId: number; enabled: boolean; description?: string | null; tags?: string[] }) {
  const { path, t, lang } = useLocale();
  const [items, setItems] = useState<UserListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setItems(null);
    setError(false);
    if (!enabled) return;
    getListItems(list.id).then(({ data }) => { if (current) setItems(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [attempt, enabled, list.id, ownerId]);
  const title = editorialText(list.name, t("searchLists"));
  const href = path(list.isPublic ? `/lists/public/${list.id}` : "/lists");
  return <li className={styles.card} aria-busy={enabled && !items && !error}>
    <div className={styles.heading}><h3><Link to={href}>{title}</Link></h3>{items && <span>{formatMovieCount(items.length, lang)}</span>}</div>
    <div className={styles.preview}>{error ? <RetryNotice className={styles.error} message={t("loadItemsError")} retryLabel={t("retry")} onRetry={() => setAttempt(value => value + 1)} /> : items ? <Link className={styles.posters} to={href} aria-label={title}><ListPosterStack movies={items.map(item => item.movie)} label={title} fallbackTitle={t("untitledFilm")} layout="catalog" /></Link> : <p className={styles.loading} role="status">{t("loading")}</p>}</div>
    {(description || (tags && tags.length > 0)) && <div className={styles.body}>{description && <p className={styles.description}>{description}</p>}{tags && tags.length > 0 && <div className={styles.tags} role="group" aria-label={t("tags")}>{tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}</div>}</div>}
  </li>;
}
