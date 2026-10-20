import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import UserFollowRow from "../components/UserFollowRow";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { getDirectoryUsers, getHqUsers, getPopularReviewers, type CommunityUserPage, type PopularReviewer } from "../api/social.api";
import { useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { FollowActionsProvider } from "../context/FollowActionsContext";
import styles from "./Community.module.css";

type CommunitySection = "reviewers" | "hq" | "directory";
type CommunitySectionErrors = Partial<Record<CommunitySection, true>>;

export default function Community() {
  const { path, t, lang } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [hqUsers, setHqUsers] = useState<CommunityUserPage | null>(null);
  const [directory, setDirectory] = useState<CommunityUserPage | null>(null);
  const [directoryPage, setDirectoryPage] = useState(0);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [sectionLoading, setSectionLoading] = useState<Record<CommunitySection, boolean>>({ reviewers: true, hq: true, directory: true });
  const [sectionErrors, setSectionErrors] = useState<CommunitySectionErrors>({});
  const [attempt, setAttempt] = useState(0);
  const [sectionAttempts, setSectionAttempts] = useState<Record<CommunitySection, number>>({ reviewers: 0, hq: 0, directory: 0 });

  useEffect(() => {
    let current = true;
    setSectionLoading(value => ({ ...value, reviewers: true }));
    setSectionErrors(value => { const next = { ...value }; delete next.reviewers; return next; });
    setReviewers([]);
    getPopularReviewers()
      .then(({ data }) => { if (current) setReviewers(data); })
      .catch(() => { if (current) setSectionErrors(value => ({ ...value, reviewers: true })); })
      .finally(() => { if (current) setSectionLoading(value => ({ ...value, reviewers: false })); });
    return () => { current = false; };
  }, [lang, attempt, sectionAttempts.reviewers]);

  useEffect(() => {
    let current = true;
    setSectionLoading(value => ({ ...value, hq: true }));
    setSectionErrors(value => { const next = { ...value }; delete next.hq; return next; });
    setHqUsers(null);
    getHqUsers()
      .then(({ data }) => { if (current) setHqUsers(data); })
      .catch(() => { if (current) setSectionErrors(value => ({ ...value, hq: true })); })
      .finally(() => { if (current) setSectionLoading(value => ({ ...value, hq: false })); });
    return () => { current = false; };
  }, [lang, attempt, sectionAttempts.hq]);

  useEffect(() => {
    let current = true;
    setSectionLoading(value => ({ ...value, directory: true }));
    setSectionErrors(value => { const next = { ...value }; delete next.directory; return next; });
    setDirectory(null);
    getDirectoryUsers(directorySearch, directoryPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(directoryPage, data.totalPages)) {
          setDirectoryPage(getLastPageIndex(data.totalPages));
          return;
        }
        setDirectory(data);
      })
      .catch(() => { if (current) setSectionErrors(value => ({ ...value, directory: true })); })
      .finally(() => { if (current) setSectionLoading(value => ({ ...value, directory: false })); });
    return () => { current = false; };
  }, [lang, attempt, directoryPage, directorySearch, sectionAttempts.directory]);

  const submitDirectorySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDirectoryPage(0);
    setDirectorySearch(directoryQuery.trim());
  };

  const retrySection = (section: CommunitySection) => {
    setSectionAttempts(current => ({ ...current, [section]: current[section] + 1 }));
  };

  const allSectionsLoading = Object.values(sectionLoading).some(Boolean);

  return <FollowActionsProvider><main className={styles.page} aria-labelledby="community-title" aria-busy={allSectionsLoading}>
    <div className={styles.shell}>
      <section className={styles.hero} aria-labelledby="community-title">
        <h1 id="community-title">{t("community")}</h1>
        <p>{t("communitySubtitle")}</p>
      </section>
      {allSectionsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {Object.keys(sectionErrors).length > 0 && <p className={styles.alert} role="alert">{t("loadCommunityError")} <RetryButton label={t("retry")} onClick={() => setAttempt(value => value + 1)} /></p>}
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="community-reviewers" aria-busy={sectionLoading.reviewers}>
          <div className={styles.cardHeading}><div className={styles.headingRow}><h2 id="community-reviewers">{t("popularReviewers")}</h2><Link to={path("/community/reviewers")}>{t("viewAll")}</Link></div></div>
          {sectionLoading.reviewers ? <p className={styles.loading} role="status">{t("loading")}</p> : sectionErrors.reviewers ? <RetryNotice className={styles.sectionStatus} message={t("loadCommunityError")} retryLabel={t("retry")} onRetry={() => retrySection("reviewers")} /> : reviewers.length === 0 ? <p className={styles.empty}>{t("noPopularReviewers")}</p> : <ul className={styles.list}>{reviewers.map(reviewer => <UserFollowRow key={reviewer.id} user={reviewer} href={path(`/users/${reviewer.id}`)} meta={`${reviewer.likes} ${t("likes")}`} />)}</ul>}
        </section>
        <section className={styles.card} aria-labelledby="community-hq" aria-busy={sectionLoading.hq}>
          <div className={styles.cardHeading}><h2 id="community-hq">{t("hqUsers")}</h2></div>
          {sectionLoading.hq ? <p className={styles.loading} role="status">{t("loading")}</p> : sectionErrors.hq ? <RetryNotice className={styles.sectionStatus} message={t("loadCommunityError")} retryLabel={t("retry")} onRetry={() => retrySection("hq")} /> : !hqUsers || hqUsers.content.length === 0 ? <p className={styles.empty}>{t("noHqUsers")}</p> : <ul className={styles.list}>{hqUsers.content.map(member => <UserFollowRow key={member.id} user={member} href={path(`/users/${member.id}`)} meta={t("hq")} />)}</ul>}
        </section>
        <section className={`${styles.card} ${styles.directoryCard}`} aria-labelledby="community-directory" aria-busy={sectionLoading.directory}>
          <div className={styles.cardHeading}><h2 id="community-directory">{t("allUsers")}</h2></div>
          <form className={styles.searchForm} onSubmit={submitDirectorySearch}>
            <label htmlFor="community-user-search">{t("searchUsers")}</label>
            <div><input id="community-user-search" aria-label={t("searchUsers")} value={directoryQuery} onChange={event => setDirectoryQuery(event.target.value)} placeholder={t("searchUsers")} /><button type="submit">{t("search")}</button></div>
          </form>
          {sectionLoading.directory ? <p className={styles.loading} role="status">{t("loading")}</p> : sectionErrors.directory ? <RetryNotice className={styles.sectionStatus} message={t("loadCommunityError")} retryLabel={t("retry")} onRetry={() => retrySection("directory")} /> : !directory || directory.content.length === 0 ? <p className={styles.empty}>{t("noUsers")}</p> : <><ul className={styles.list}>{directory.content.map(member => <UserFollowRow key={member.id} user={member} href={path(`/users/${member.id}`)} />)}</ul><Pagination className={styles.pagination} page={directoryPage} totalPages={directory.totalPages} label={t("communityUsersPagination")} busy={sectionLoading.directory} onPageChange={setDirectoryPage} /></>}
        </section>
      </div>
    </div>
  </main></FollowActionsProvider>;
}
