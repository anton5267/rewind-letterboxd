import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getPopularReviewers, type PopularReviewer } from "../api/social.api";
import { useLocale } from "../i18n";

interface Page<T> { content: T[]; totalPages: number }
interface HqUser { id: number; username: string; displayName: string | null; avatarUrl: string | null }

export default function Community() {
  const { path, t, lang } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [hqUsers, setHqUsers] = useState<Page<HqUser> | null>(null);
  const [directory, setDirectory] = useState<Page<HqUser> | null>(null);
  const [directoryPage, setDirectoryPage] = useState(0);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    Promise.all([
      getPopularReviewers(),
      api.get<Page<HqUser>>("/users/hq", { params: { page: 0, size: 12 } }),
      api.get<Page<HqUser>>("/users/directory", { params: { q: directorySearch || undefined, page: directoryPage, size: 12 } }),
    ]).then(([reviewersResponse, hqResponse, directoryResponse]) => {
      if (!current) return;
      setReviewers(reviewersResponse.data);
      setHqUsers(hqResponse.data);
      setDirectory(directoryResponse.data);
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [lang, attempt, directoryPage, directorySearch]);

  const submitDirectorySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDirectoryPage(0);
    setDirectorySearch(directoryQuery.trim());
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("community")}</h1>
    <p>{t("communitySubtitle")}</p>
    {loading && <p role="status">{t("loading")}</p>}
    {error && <p role="alert">{t("loadCommunityError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
    {!loading && !error && <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <section aria-labelledby="community-reviewers">
        <h2 id="community-reviewers">{t("popularReviewers")}</h2>
        {reviewers.length === 0 ? <p>{t("noPopularReviewers")}</p> : <ul>{reviewers.map(reviewer => <li key={reviewer.id}><Link to={path(`/users/${reviewer.id}`)}>{reviewer.displayName || `@${reviewer.username}`}</Link> · {t("likes")}: {reviewer.likes}</li>)}</ul>}
      </section>
      <section aria-labelledby="community-hq">
        <h2 id="community-hq">{t("hqUsers")}</h2>
        {!hqUsers || hqUsers.content.length === 0 ? <p>{t("noHqUsers")}</p> : <ul>{hqUsers.content.map(member => <li key={member.id}><Link to={path(`/users/${member.id}`)}>{member.displayName || `@${member.username}`}</Link></li>)}</ul>}
      </section>
      <section aria-labelledby="community-directory">
        <h2 id="community-directory">{t("allUsers")}</h2>
        <form onSubmit={submitDirectorySearch} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <label htmlFor="community-user-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>{t("searchUsers")}</label>
          <input id="community-user-search" value={directoryQuery} onChange={event => setDirectoryQuery(event.target.value)} placeholder={t("searchUsers")} />
          <button type="submit">{t("search")}</button>
        </form>
        {!directory || directory.content.length === 0 ? <p>{t("noUsers")}</p> : <><ul>{directory.content.map(member => <li key={member.id}><Link to={path(`/users/${member.id}`)}>{member.displayName || `@${member.username}`}</Link></li>)}</ul>{directory.totalPages > 1 && <nav aria-label={t("communityUsersPagination")} style={{ display: "flex", gap: 8 }}><button type="button" disabled={directoryPage === 0} onClick={() => setDirectoryPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {directoryPage + 1} {t("of")} {directory.totalPages}</span><button type="button" disabled={directoryPage + 1 >= directory.totalPages} onClick={() => setDirectoryPage(page => page + 1)}>{t("next")}</button></nav>}</>}
      </section>
    </div>}
  </main>;
}
