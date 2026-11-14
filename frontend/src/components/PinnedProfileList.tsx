import { useEffect, useId, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import { getPublicList, type PublicListDetails } from "../api/lists.api";
import { editorialText, formatMovieCount, useLocale } from "../i18n";
import CommentThread from "./comments/CommentThread";
import ListPosterStack from "./ListPosterStack";
import RetryNotice from "./RetryNotice";
import styles from "./PinnedProfileList.module.css";

export default function PinnedProfileList(
  { listId, ownerId }: { listId: number; ownerId: number },
) {
  const { t, path, lang } = useLocale();
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const retryOrigin = useRef<Element | null>(null);
  const [list, setList] = useState<PublicListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setList(null);
    setError(false);
    getPublicList(listId).then(({ data }) => {
      if (current && data.id === listId && data.ownerId === ownerId) {
        setList(data);
      }
    }).catch((failure) => {
      if (
        current && (!isAxiosError(failure) || failure.response?.status !== 404)
      ) setError(true);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [listId, ownerId, attempt]);

  useEffect(() => {
    if (loading || !retryOrigin.current) return;
    const origin = retryOrigin.current;
    const frame = requestAnimationFrame(() => {
      retryOrigin.current = null;
      if (
        document.activeElement === document.body ||
        document.activeElement === origin
      ) heading.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [loading]);

  const visibleList = list?.id === listId && list.ownerId === ownerId
    ? list
    : null;
  if (!loading && !error && !visibleList) return null;
  const name = editorialText(visibleList?.name, t("lists"));
  const href = path(`/lists/public/${listId}`);
  return (
    <section
      className={styles.root}
      aria-labelledby={headingId}
      aria-busy={loading}
    >
      <h2 id={headingId} ref={heading} tabIndex={-1}>{t("pinnedList")}</h2>
      {loading && <p role="status">{t("loading")}</p>}
      {error && (
        <RetryNotice
          className={styles.error}
          message={t("loadPublicListError")}
          retryLabel={t("retry")}
          onRetry={() => {
            retryOrigin.current = document.activeElement;
            setAttempt((value) => value + 1);
          }}
        />
      )}
      {visibleList && (
        <>
          <article className={styles.card}>
            <Link className={styles.posters} to={href} aria-label={name}>
              <ListPosterStack
                movies={visibleList.movies}
                label={name}
                fallbackTitle={t("untitledFilm")}
                layout="catalog"
                size="large"
              />
            </Link>
            <div className={styles.copy}>
              <h3>
                <Link to={href}>{name}</Link>
              </h3>
              <p className={styles.count}>
                {formatMovieCount(visibleList.movies.length, lang)}
              </p>
              {visibleList.description && (
                <p className={styles.description}>{visibleList.description}</p>
              )}
            </div>
          </article>
          <CommentThread key={listId} listId={listId} />
        </>
      )}
    </section>
  );
}
