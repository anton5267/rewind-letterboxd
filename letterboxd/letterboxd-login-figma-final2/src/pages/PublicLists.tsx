import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPublicListFeed, type PublicList } from "../api/lists.api";
import { getPopularTags, type PopularTag } from "../api/tags.api";
import ListPosterStack from "../components/ListPosterStack";
import { formatMovieCount, useLocale } from "../i18n";
import { toTagSlug } from "../utils/tagSlug";
import styles from "./PublicLists.module.css";

type Feed = "recent" | "popular" | "recently-liked" | "team";

export default function PublicLists() {
  const { path, t, lang } = useLocale();
  const [searchParams] = useSearchParams();
  const rawTag = searchParams.get("tag") ?? "";
  const tag = rawTag ? toTagSlug(rawTag) : "";
  const filterLabel = rawTag.trim() || tag;
  const feedParam = searchParams.get("feed");
  const feed: Feed = feedParam === "popular" || feedParam === "recently-liked" || feedParam === "team" ? feedParam : "recent";
  const isCompactFeed = feed === "popular" || feed === "recently-liked";
  const [lists, setLists] = useState<PublicList[]>([]);
  const [tags, setTags] = useState<PopularTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState(false);
  const [tagsAttempt, setTagsAttempt] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [tag, feed]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setLists([]);
    setTotalPages(0);
    getPublicListFeed(feed, page, tag)
      .then(({ data }) => {
        if (!current) return;
        setLists(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        if (!current) return;
        setError(true);
        setTotalPages(0);
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [tag, feed, lang, page, attempt]);

  useEffect(() => {
    let current = true;
    setTagsLoading(true);
    setTagsError(false);
    setTags([]);
    getPopularTags()
      .then(({ data }) => { if (current) setTags(data); })
      .catch(() => { if (current) setTagsError(true); })
      .finally(() => { if (current) setTagsLoading(false); });
    return () => { current = false; };
  }, [lang, tagsAttempt]);

  const feedLinks: { value: Feed; label: string }[] = [
    { value: "recent", label: t("listFeedRecent") },
    { value: "popular", label: t("listFeedPopular") },
    { value: "recently-liked", label: t("listFeedRecentlyLiked") },
    { value: "team", label: t("listFeedTeam") },
  ];

  return <main className={styles.page} aria-busy={loading || tagsLoading}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("collectionsEyebrow")}</p>
        <h1>{t("discoverLists")}</h1>
        <p>{t("discoverListsIntro")}</p>
        <div className={styles.heroActions}>
          <Link className={styles.heroAction} to={path("/lists")}>{t("newList")}</Link>
          <Link className={styles.heroSecondaryAction} to={path("/films")}>{t("films")}</Link>
        </div>
      </section>

      <nav className={styles.feedNav} aria-label={t("listFeeds")}>
        {feedLinks.map(item => <Link
          key={item.value}
          className={feed === item.value ? styles.activeFeed : undefined}
          aria-current={feed === item.value ? "page" : undefined}
          to={path(`/lists/discover?feed=${item.value}`)}
        >{item.label}</Link>)}
      </nav>

      <section className={styles.tagsSection} aria-labelledby="popular-tags-heading" aria-busy={tagsLoading}>
        <div className={styles.sectionHeading}>
          <h2 id="popular-tags-heading">{t("popularTags")}</h2>
          <Link to={path("/lists/discover?feed=recent")}>{t("viewAll")}</Link>
        </div>
        {tagsLoading && <p className={styles.muted} role="status">{t("loading")}</p>}
        {tagsError && <p className={styles.alert} role="alert">{t("loadTagsError")} <button type="button" onClick={() => setTagsAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!tagsLoading && !tagsError && tags.length === 0 && <p className={styles.muted}>{t("noTags")}</p>}
        {!tagsLoading && !tagsError && tags.length > 0 && <div className={styles.tagRail}>
          {tags.map(item => <Link className={tag === item.slug ? styles.selectedTag : undefined} aria-current={tag === item.slug ? "page" : undefined} key={item.id} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(item.slug)}`)}>#{item.name}</Link>)}
        </div>}
      </section>

      <section aria-labelledby="lists-grid-heading" aria-busy={loading}>
        <div className={styles.sectionHeading}>
          <h2 id="lists-grid-heading">{feedLinks.find(item => item.value === feed)?.label}</h2>
          {tag && <span className={styles.filter}>#{filterLabel}</span>}
        </div>

        {loading && <div className={isCompactFeed ? styles.featuredGrid : styles.grid} aria-label={t("loading")} role="status">
          {Array.from({ length: 6 }, (_, index) => <div className={`${styles.skeleton} ${isCompactFeed ? styles.featuredSkeleton : ""}`} key={index} />)}
        </div>}
        {error && <p className={styles.alert} role="alert">{t("loadPublicListError")} <button type="button" aria-busy={loading} onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!loading && !error && lists.length === 0 && <div className={styles.empty}><p>{tag && feed === "recent" ? t("noTaggedLists") : t("noPublicLists")}</p></div>}
        {!loading && !error && lists.length > 0 && <div className={isCompactFeed ? styles.featuredGrid : styles.grid}>
          {lists.map(list => <article className={isCompactFeed ? styles.featuredCard : styles.card} key={list.id}>
            <Link className={isCompactFeed ? styles.featuredPosterLink : styles.posterLink} to={path(`/lists/public/${list.id}`)} aria-label={list.name}>
              <ListPosterStack movies={list.previewMovies ?? []} label={list.name} size={isCompactFeed ? "featured" : "compact"} />
            </Link>
            <div className={styles.cardBody}>
              <h2><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link></h2>
              {list.description && <p className={styles.description}>{list.description}</p>}
              {list.tags.length > 0 && <div className={styles.cardTags}>{list.tags.slice(0, 3).map(name => <Link key={name} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(name))}`)}>#{name}</Link>)}</div>}
              <p className={styles.meta}>{list.itemCount != null && <>{formatMovieCount(list.itemCount, lang)} · </>}{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link>{list.likeCount != null && <> · {list.likeCount} {t("likes").toLocaleLowerCase()}</>}</p>
            </div>
          </article>)}
        </div>}
      </section>

      {totalPages > 1 && <nav className={styles.pagination} aria-label={t("publicListsPagination")}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
        <button type="button" disabled={loading || page + 1 >= totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>}
    </div>
  </main>;
}
