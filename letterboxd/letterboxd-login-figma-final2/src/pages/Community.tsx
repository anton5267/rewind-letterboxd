import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ResilientImage from "../components/ResilientImage";
import { getPopularReviewers, type PopularReviewer } from "../api/social.api";
import { useLocale } from "../i18n";
import styles from "./Community.module.css";

interface Page<T> { content: T[]; totalPages: number }
interface HqUser { id: number; username: string; displayName: string | null; avatarUrl: string | null }
type CommunityUser = Pick<HqUser, "id" | "username" | "displayName" | "avatarUrl">;
type CommunitySection = "reviewers" | "hq" | "directory";
type CommunitySectionErrors = Partial<Record<CommunitySection, true>>;

function SectionFailure({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return <p className={styles.sectionStatus} role="alert">{message} <button type="button" onClick={onRetry}>{retryLabel}</button></p>;
}

function UserAvatar({ user }: { user: CommunityUser }) {
  const label = user.displayName || `@${user.username}`;
  return <ResilientImage className={styles.avatar} src={user.avatarUrl} alt="" width={44} height={44}
    fallback={<span className={styles.avatarFallback} aria-hidden="true">{label.slice(0, 1).toUpperCase()}</span>} />;
}

function UserRow({ user, href, meta }: { user: CommunityUser; href: string; meta?: string }) {
  return <li className={styles.userRow}>
    <Link className={styles.userLink} to={href}>
      <UserAvatar user={user} />
      <span className={styles.userCopy}>
        <strong>{user.displayName || `@${user.username}`}</strong>
        <span>@{user.username}</span>
      </span>
    </Link>
    <span className={styles.rowMeta}>{meta}<span className={styles.rowAction} aria-hidden="true">＋</span></span>
  </li>;
}

export default function Community() {
  const { path, t, lang } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [hqUsers, setHqUsers] = useState<Page<HqUser> | null>(null);
  const [directory, setDirectory] = useState<Page<HqUser> | null>(null);
  const [directoryPage, setDirectoryPage] = useState(0);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [sectionLoading, setSectionLoading] = useState<Record<CommunitySection, boolean>>({ reviewers: true, hq: true, directory: true });
  const [sectionErrors, setSectionErrors] = useState<CommunitySectionErrors>({});
  const [attempt, setAttempt] = useState(0);

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
  }, [lang, attempt]);

  useEffect(() => {
    let current = true;
    setSectionLoading(value => ({ ...value, hq: true }));
    setSectionErrors(value => { const next = { ...value }; delete next.hq; return next; });
    setHqUsers(null);
    api.get<Page<HqUser>>("/users/hq", { params: { page: 0, size: 12 } })
      .then(({ data }) => { if (current) setHqUsers(data); })
      .catch(() => { if (current) setSectionErrors(value => ({ ...value, hq: true })); })
      .finally(() => { if (current) setSectionLoading(value => ({ ...value, hq: false })); });
    return () => { current = false; };
  }, [lang, attempt]);

  useEffect(() => {
    let current = true;
    setSectionLoading(value => ({ ...value, directory: true }));
    setSectionErrors(value => { const next = { ...value }; delete next.directory; return next; });
    setDirectory(null);
    api.get<Page<HqUser>>("/users/directory", { params: { q: directorySearch || undefined, page: directoryPage, size: 12 } })
      .then(({ data }) => { if (current) setDirectory(data); })
      .catch(() => { if (current) setSectionErrors(value => ({ ...value, directory: true })); })
      .finally(() => { if (current) setSectionLoading(value => ({ ...value, directory: false })); });
    return () => { current = false; };
  }, [lang, attempt, directoryPage, directorySearch]);

  const submitDirectorySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDirectoryPage(0);
    setDirectorySearch(directoryQuery.trim());
  };

  const allSectionsLoading = Object.values(sectionLoading).some(Boolean);

  return <main className={styles.page} aria-busy={allSectionsLoading}>
    <div className={styles.shell}>
      <section className={styles.hero} aria-labelledby="community-title">
        <p className={styles.eyebrow}>{t("community")}</p>
        <h1 id="community-title">{t("community")}</h1>
        <p>{t("communitySubtitle")}</p>
      </section>
      {allSectionsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {Object.keys(sectionErrors).length > 0 && <p className={styles.alert} role="alert">{t("loadCommunityError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="community-reviewers" aria-busy={sectionLoading.reviewers}>
          <div className={styles.cardHeading}><p className={styles.eyebrow}>{t("popularReviewers")}</p><h2 id="community-reviewers">{t("popularReviewers")}</h2></div>
          {sectionLoading.reviewers ? <p className={styles.loading} role="status">{t("loading")}</p> : sectionErrors.reviewers ? <SectionFailure message={t("loadCommunityError")} retryLabel={t("retry")} onRetry={() => setAttempt(value => value + 1)} /> : reviewers.length === 0 ? <p className={styles.empty}>{t("noPopularReviewers")}</p> : <ul className={styles.list}>{reviewers.map(reviewer => <UserRow key={reviewer.id} user={reviewer} href={path(`/users/${reviewer.id}`)} meta={`${reviewer.likes} ${t("likes")}`} />)}</ul>}
        </section>
        <section className={styles.card} aria-labelledby="community-hq" aria-busy={sectionLoading.hq}>
          <div className={styles.cardHeading}><p className={styles.eyebrow}>{t("hqUsers")}</p><h2 id="community-hq">{t("hqUsers")}</h2></div>
          {sectionLoading.hq ? <p className={styles.loading} role="status">{t("loading")}</p> : sectionErrors.hq ? <SectionFailure message={t("loadCommunityError")} retryLabel={t("retry")} onRetry={() => setAttempt(value => value + 1)} /> : !hqUsers || hqUsers.content.length === 0 ? <p className={styles.empty}>{t("noHqUsers")}</p> : <ul className={styles.list}>{hqUsers.content.map(member => <UserRow key={member.id} user={member} href={path(`/users/${member.id}`)} meta={t("hq")} />)}</ul>}
        </section>
        <section className={`${styles.card} ${styles.directoryCard}`} aria-labelledby="community-directory" aria-busy={sectionLoading.directory}>
          <div className={styles.cardHeading}><p className={styles.eyebrow}>{t("allUsers")}</p><h2 id="community-directory">{t("allUsers")}</h2></div>
          <form className={styles.searchForm} onSubmit={submitDirectorySearch}>
            <label htmlFor="community-user-search">{t("searchUsers")}</label>
            <div><input id="community-user-search" aria-label={t("searchUsers")} value={directoryQuery} onChange={event => setDirectoryQuery(event.target.value)} placeholder={t("searchUsers")} /><button type="submit">{t("search")}</button></div>
          </form>
          {sectionLoading.directory ? <p className={styles.loading} role="status">{t("loading")}</p> : sectionErrors.directory ? <SectionFailure message={t("loadCommunityError")} retryLabel={t("retry")} onRetry={() => setAttempt(value => value + 1)} /> : !directory || directory.content.length === 0 ? <p className={styles.empty}>{t("noUsers")}</p> : <><ul className={styles.list}>{directory.content.map(member => <UserRow key={member.id} user={member} href={path(`/users/${member.id}`)} />)}</ul>{directory.totalPages > 1 && <nav className={styles.pagination} aria-label={t("communityUsersPagination")}><button type="button" disabled={sectionLoading.directory || directoryPage === 0} onClick={() => setDirectoryPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {directoryPage + 1} {t("of")} {directory.totalPages}</span><button type="button" disabled={sectionLoading.directory || directoryPage + 1 >= directory.totalPages} onClick={() => setDirectoryPage(page => page + 1)}>{t("next")}</button></nav>}</>}
        </section>
      </div>
    </div>
  </main>;
}
