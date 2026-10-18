import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { getPublicListFeed, type PublicList } from "../api/lists.api";
import { useLocale } from "../i18n";

interface Tag { id: number; name: string; slug: string }
type Feed = "recent" | "popular" | "recently-liked" | "team";

export default function PublicLists() {
  const { path, t, lang } = useLocale();
  const [searchParams] = useSearchParams();
  const tag = searchParams.get("tag") ?? "";
  const feedParam = searchParams.get("feed");
  const feed: Feed = feedParam === "popular" || feedParam === "recently-liked" || feedParam === "team" ? feedParam : "recent";
  const [lists, setLists] = useState<PublicList[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
    Promise.all([
      getPublicListFeed(feed, page, tag),
      api.get<Tag[]>("/tags/popular", { params: { size: 30 } }),
    ]).then(([listsResponse, tagsResponse]) => {
      if (!current) return;
      setLists(listsResponse.data.content);
      setTotalPages(listsResponse.data.totalPages);
      setTags(tagsResponse.data);
    }).catch(() => { if (current) { setError(true); setTotalPages(0); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [tag, feed, lang, page, attempt]);

  return <main aria-busy={loading} style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("discoverLists")}</h1>
    <nav aria-label={t("listFeeds")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Link aria-current={feed === "recent" ? "page" : undefined} to={path("/lists/discover?feed=recent")}>{t("listFeedRecent")}</Link>
      <Link aria-current={feed === "popular" ? "page" : undefined} to={path("/lists/discover?feed=popular")}>{t("listFeedPopular")}</Link>
      <Link aria-current={feed === "recently-liked" ? "page" : undefined} to={path("/lists/discover?feed=recently-liked")}>{t("listFeedRecentlyLiked")}</Link>
      <Link aria-current={feed === "team" ? "page" : undefined} to={path("/lists/discover?feed=team")}>{t("listFeedTeam")}</Link>
    </nav>
    <section>
      <h2>{t("popularTags")}</h2>
      {tags.length === 0 ? <p>{t("noTags")}</p> : <p style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Link to={path("/lists/discover?feed=recent")}>{t("viewAll")}</Link>
        {tags.map(item => <Link key={item.id} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(item.slug)}`)}>#{item.name}</Link>)}
      </p>}
    </section>
    {loading && <p role="status">{t("loading")}</p>}
    {error && <p role="alert">{t("loadPublicListError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
    {!loading && !error && <section>
        {lists.length === 0 ? <p>{tag && feed === "recent" ? t("noTaggedLists") : t("noPublicLists")}</p> : <ul>{lists.map(list => <li key={list.id}>
        <h2><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link></h2>
        {list.description && <p>{list.description}</p>}
        {list.tags.length > 0 && <p>{list.tags.map(name => `#${name}`).join(" · ")}</p>}
        <small>{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link>{list.likeCount != null && ` · ${t("likes")}: ${list.likeCount}`}</small>
      </li>)}</ul>}
      {totalPages > 1 && <nav aria-label={t("publicListsPagination")} style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>}
    </section>}
  </main>;
}
