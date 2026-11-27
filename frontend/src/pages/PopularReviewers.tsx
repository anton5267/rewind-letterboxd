import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularReviewers, getPopularReviewersPage, type PopularReviewer, type PopularReviewerPage } from "../api/social.api";
import UserFollowRow from "../components/UserFollowRow";
import { FollowActionsProvider } from "../context/FollowActionsContext";
import RetryNotice from "../components/RetryNotice";
import { formatReviewCount, useLocale } from "../i18n";
import { getUserIdentity, getUserInitial } from "../utils/userIdentity";
import styles from "./PopularReviewers.module.css";

const PAGE_SIZE = 10;
const API_SIZE = 24;

type PageItem = number | "ellipsis";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 4) return Array.from({ length: totalPages }, (_, index) => index);
  if (currentPage <= 2) return [0, 1, 2, "ellipsis", totalPages - 1];
  if (currentPage >= totalPages - 3) return [0, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1];
  return [0, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages - 1];
}

export default function PopularReviewers() {
  const { lang, path, t } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [reviewersPage, setReviewersPage] = useState<PopularReviewerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const firstFilterRender = useRef(true);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const retryFocus = useRef<{ origin: HTMLElement; lang: string } | null>(null);

  useEffect(() => {
    retryFocus.current = null;
  }, [lang]);

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (pending.lang !== lang) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (error) resultsRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else resultsRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lang, loading, error, reviewers]);

  const retryLoad = () => {
    if (document.activeElement instanceof HTMLElement) retryFocus.current = { origin: document.activeElement, lang };
    setLoading(true);
    setError(false);
    setRetry(value => value + 1);
  };

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setReviewers([]);
    setReviewersPage(null);
    setPage(0);
    Promise.all([getPopularReviewers(API_SIZE), getPopularReviewersPage(0, PAGE_SIZE)])
      .then(([membersResponse, pageResponse]) => {
        if (!current) return;
        setReviewers(membersResponse.data);
        setReviewersPage(pageResponse.data);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [lang, retry]);

  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false;
      return;
    }
    let current = true;
    const timer = window.setTimeout(() => {
      setPage(0);
      setPageLoading(true);
      setError(false);
      getPopularReviewersPage(0, PAGE_SIZE, filterQuery.trim())
        .then(({ data }) => { if (current) setReviewersPage(data); })
        .catch(() => { if (current) setError(true); })
        .finally(() => { if (current) setPageLoading(false); });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [filterQuery]);

  const loadPage = async (nextPage: number) => {
    if (nextPage === page || pageLoading) return;
    setPageLoading(true);
    try {
      const { data } = await getPopularReviewersPage(nextPage, PAGE_SIZE, filterQuery.trim());
      setReviewersPage(data);
      setPage(nextPage);
    } catch {
      setError(true);
    } finally {
      setPageLoading(false);
    }
  };

  const visibleReviewers = reviewersPage?.content ?? [];

  const closeFilter = () => {
    setFilterOpen(false);
    setFilterQuery("");
    window.requestAnimationFrame(() => filterButtonRef.current?.focus());
  };

  return <FollowActionsProvider><main className={styles.page} aria-labelledby="popular-reviewers-title" aria-busy={loading || pageLoading}>
    <header className={styles.hero}>
      <div className={styles.toolbar}>
        <Link className={styles.toolbarButton} to={path("/community")} aria-label={t("community")}><img className={styles.toolbarBackIcon} src="/images/popular-reviewers-back.png" alt="" /></Link>
        <span className={styles.toolbarTitle} aria-hidden="true">{t("popularReviewers")}</span>
        <button ref={filterButtonRef} className={styles.toolbarButton} type="button" aria-label={t("filterReviewers")} aria-expanded={filterOpen} aria-controls="reviewer-filter-panel" onClick={() => {
          const opening = !filterOpen;
          setFilterOpen(opening);
          if (opening) window.requestAnimationFrame(() => filterInputRef.current?.focus());
          else { setFilterQuery(""); }
        }}><img className={styles.toolbarFilterIcon} src="/images/popular-reviewers-filter.png" alt="" /></button>
      </div>
      {filterOpen && <div id="reviewer-filter-panel" className={styles.filterPanel} role="search">
        <label className="srOnly" htmlFor="popular-reviewers-filter">{t("searchReviewersOnPage")}</label>
        <input ref={filterInputRef} id="popular-reviewers-filter" type="search" maxLength={80} autoFocus value={filterQuery} placeholder={t("searchReviewersOnPage")} onChange={event => setFilterQuery(event.target.value)} onKeyDown={event => {
          if (event.key === "Escape") { event.preventDefault(); closeFilter(); }
        }} />
        <p>{t("searchReviewersCurrentPage")}</p>
      </div>}
      <div className={styles.heroCopy}>
        <h1 id="popular-reviewers-title">{t("popularReviewers")}</h1>
        <p>{t("popularReviewersIntro")}</p>
      </div>
    </header>

    <section ref={resultsRef} className={styles.shell} aria-labelledby="popular-reviewers-title" aria-busy={loading || pageLoading} tabIndex={-1}>
      <div className={styles.sectionHeading}><h2>{t("popularReviewers")}</h2><span>{t("sortByPopularity")}</span></div>
      {loading && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.table} aria-hidden="true">{Array.from({ length: PAGE_SIZE }, (_, item) => <div className={styles.skeletonRow} key={item}><div className={styles.skeletonAvatar} /><div className={styles.skeletonLine} /></div>)}</div></>}
      {error && <RetryNotice className={styles.status} message={t("loadCommunityError")} retryLabel={t("retry")} busy={loading} onRetry={retryLoad} />}
      {!loading && !error && reviewersPage?.totalElements === 0 && <p className={styles.empty}>{filterQuery.trim() ? t("noReviewerMatches") : t("noPopularReviewers")}</p>}
      {!loading && !error && reviewersPage && reviewersPage.content.length > 0 && <div className={styles.table}>
        <div className={styles.columnHeadings} aria-hidden="true"><span>{t("name")}</span><span>{t("watched")}</span><span>{t("searchLists")}</span><span>{t("likes")}</span><span /></div>
        <ul id="reviewer-list" className={styles.list}>
          {visibleReviewers.map(reviewer => {
            const reviewCount = reviewer.reviewCount;
            const hasMetrics = reviewCount != null && reviewer.watchedCount != null && reviewer.listCount != null;
            return <UserFollowRow key={reviewer.id} user={reviewer} href={path(`/users/${reviewer.id}`)}
              subtitle={hasMetrics ? formatReviewCount(reviewCount, lang) : `${reviewer.likes} ${t("likes")}`}
              reviewerMetrics={hasMetrics ? { watched: reviewer.watchedCount!, lists: reviewer.listCount!, likes: reviewer.likes } : undefined}
              showMobileMoreAction
              avatarFallback="silhouette"
              figmaReviewerActions
              label={getUserIdentity(reviewer, t("someone"))} />;
          })}
        </ul>
      </div>}
      {!loading && !error && reviewersPage && reviewersPage.totalPages > 1 && <nav className={styles.pagination} aria-label={t("communityUsersPagination")} aria-busy={pageLoading}>
        {getPageItems(page, reviewersPage.totalPages).map((item, index) => item === "ellipsis"
          ? <span aria-hidden="true" key={`ellipsis-${index}`}>…</span>
          : <button key={item} type="button" aria-current={page === item ? "page" : undefined} onClick={() => void loadPage(item)}>{item + 1}</button>)}
      </nav>}
      {!loading && !error && !filterQuery.trim() && reviewers.length > PAGE_SIZE && <section className={styles.popularMembers} aria-labelledby="popular-members-title">
        <div className={styles.popularMembersHeading}><h2 id="popular-members-title">{t("popularMembers")}</h2><Link to={path("/community")}>{t("homeMore")}</Link></div>
        <div className={styles.popularMembersRail}>
          {reviewers.slice(PAGE_SIZE, API_SIZE).map(member => <Link key={member.id} to={path(`/users/${member.id}`)} aria-label={getUserIdentity(member, t("someone"))}>
            {member.avatarUrl ? <img src={member.avatarUrl} alt="" loading="lazy" /> : <span aria-hidden="true">{getUserInitial(member)}</span>}
          </Link>)}
        </div>
      </section>}
    </section>
  </main></FollowActionsProvider>;
}
