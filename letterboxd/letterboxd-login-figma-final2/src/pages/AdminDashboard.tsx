import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { bulkHideAdminModeration, createAdminArticle, createAdminMovie, createAdminNotification, discoverAndImportAdminTmdb, importAdminTmdb, deleteAdminConversation, deleteAdminList, deleteAdminMovie, deleteAdminNotification, deleteAdminNotifications, getAdminArticles, getAdminComments, getAdminConversations, getAdminDashboard, getAdminLists, getAdminModerationQueue, getAdminMovies, getAdminNotifications, getAdminReviews, getAdminSettings, getAdminUsers, getAuditLogs, getAdminNewsletterStatus, hideAdminModerationItem, markAdminNotificationsRead, queueAdminNewsletter, setAdminCommentHidden, setAdminHq, setAdminListVisibility, setAdminNotificationRead, setAdminReviewHidden, setAdminUserActive, syncAdminMovieTmdb, updateAdminMovie, updateAdminSetting, type AdminArticle, type AdminComment, type AdminConversation, type AdminDashboard as Dashboard, type AdminList, type AdminModerationQueueItem, type AdminMovie, type AdminMovieWrite, type AdminNotification, type AdminNotificationWrite, type AdminReview, type AdminSetting, type AdminUser, type AuditLog, type NewsletterDeliveryStatus, type TmdbDiscoveryRequest } from "../api/admin.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

export default function AdminDashboard() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [lists, setLists] = useState<AdminList[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [newsletterStatuses, setNewsletterStatuses] = useState<Record<number, NewsletterDeliveryStatus>>({});
  const [newsletterBusyId, setNewsletterBusyId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationDraft, setNotificationDraft] = useState<AdminNotificationWrite>({ recipientId: 0, type: "FOLLOW", actorId: null, relatedUserId: null, reviewId: null });
  const [notificationTypeFilter, setNotificationTypeFilter] = useState<"" | AdminNotificationWrite["type"]>("");
  const [notificationReadFilter, setNotificationReadFilter] = useState<"" | "read" | "unread">("");
  const [notificationRecipientFilter, setNotificationRecipientFilter] = useState("");
  const [moderationQueue, setModerationQueue] = useState<AdminModerationQueueItem[]>([]);
  const [moderationTypeFilter, setModerationTypeFilter] = useState<"" | AdminModerationQueueItem["type"]>("");
  const [moderationQuery, setModerationQuery] = useState("");
  const [moderationReason, setModerationReason] = useState("Moderated by administrator");
  const [selectedModeration, setSelectedModeration] = useState<string[]>([]);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [movieDraft, setMovieDraft] = useState<AdminMovieWrite>({ title: "", releaseDate: "", rating: null, photoUrl: "" });
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [tmdbIds, setTmdbIds] = useState<Record<number, string>>({});
  const [syncingMovieId, setSyncingMovieId] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [tmdbImportIds, setTmdbImportIds] = useState("");
  const [tmdbDiscoveryDraft, setTmdbDiscoveryDraft] = useState({ page: "1", year: "", genreId: "", minRating: "", limit: "20" });
  const [tmdbImportBusy, setTmdbImportBusy] = useState(false);
  const [tmdbImportMessage, setTmdbImportMessage] = useState<string | null>(null);
  const [article, setArticle] = useState({ slug: "", language: "uk", category: "Новини", title: "", excerpt: "", content: "", coverUrl: "", audioUrl: "", published: false });
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuth || user?.role !== "ADMIN") return;
    Promise.all([getAdminDashboard(), getAdminUsers(), getAuditLogs(), getAdminComments(), getAdminArticles(), getAdminReviews(), getAdminMovies(), getAdminLists(), getAdminConversations(), getAdminNotifications(), getAdminModerationQueue(), getAdminSettings()]).then(([summary, usersResponse, logsResponse, commentsResponse, articlesResponse, reviewsResponse, moviesResponse, listsResponse, conversationsResponse, notificationsResponse, moderationResponse, settingsResponse]) => {
      setDashboard(summary.data); setUsers(usersResponse.data.content); setLogs(logsResponse.data.content); setComments(commentsResponse.data.content); setArticles(articlesResponse.data.content); setReviews(reviewsResponse.data.content); setMovies(moviesResponse.data.content); setTmdbIds(Object.fromEntries(moviesResponse.data.content.filter(movie => movie.tmdbId !== null).map(movie => [movie.id, String(movie.tmdbId)]))); setLists(listsResponse.data.content); setConversations(conversationsResponse.data.content); setNotifications(notificationsResponse.data.content); setModerationQueue(moderationResponse.data.content); setSettings(settingsResponse.data);
    }).catch(() => setError(true));
  }, [isAuth, user?.role]);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth || user?.role !== "ADMIN") return <Navigate to={path("/home")} replace />;
  const toggleHq = async (target: AdminUser) => {
    try { const { data } = await setAdminHq(target.id, !target.isHq); setUsers(current => current.map(item => item.id === data.id ? data : item)); setDashboard(current => current ? { ...current, hqUsers: current.hqUsers + (data.isHq ? 1 : -1) } : current); }
    catch { setError(true); }
  };
  const toggleUserActive = async (target: AdminUser) => {
    try { await setAdminUserActive(target.id, !target.isActive); setUsers(current => current.map(item => item.id === target.id ? { ...item, isActive: !target.isActive } : item)); }
    catch { setError(true); }
  };
  const searchUsers = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const { data } = await getAdminUsers(userQuery); setUsers(data.content); }
    catch { setError(true); }
  };
  const toggleComment = async (comment: AdminComment) => {
    try { const { data } = await setAdminCommentHidden(comment.id, !comment.isHidden, comment.isHidden ? "" : "Moderated by administrator"); setComments(current => current.map(item => item.id === data.id ? data : item)); }
    catch { setError(true); }
  };
  const toggleReview = async (review: AdminReview) => {
    try { const { data } = await setAdminReviewHidden(review.id, !review.isHidden, review.isHidden ? "" : "Moderated by administrator"); setReviews(current => current.map(item => item.id === data.id ? data : item)); }
    catch { setError(true); }
  };
  const toggleList = async (list: AdminList) => {
    try { const { data } = await setAdminListVisibility(list.id, !list.isPublic); setLists(current => current.map(item => item.id === data.id ? data : item)); }
    catch { setError(true); }
  };
  const removeList = async (list: AdminList) => {
    if (list.listType !== "CUSTOM" || !window.confirm(t("deleteListConfirm"))) return;
    try { await deleteAdminList(list.id); setLists(current => current.filter(item => item.id !== list.id)); }
    catch { setError(true); }
  };
  const removeConversation = async (conversation: AdminConversation) => {
    if (!window.confirm(t("deleteConversationConfirm"))) return;
    try { await deleteAdminConversation(conversation.id); setConversations(current => current.filter(item => item.id !== conversation.id)); }
    catch { setError(true); }
  };
  const removeNotification = async (notification: AdminNotification) => {
    if (!window.confirm(t("deleteNotificationConfirm"))) return;
    try { await deleteAdminNotification(notification.id); setNotifications(current => current.filter(item => item.id !== notification.id)); }
    catch { setError(true); }
  };
  const toggleNotificationRead = async (notification: AdminNotification) => {
    try { const { data } = await setAdminNotificationRead(notification.id, !notification.readAt); setNotifications(current => current.map(item => item.id === data.id ? data : item)); }
    catch { setError(true); }
  };
  const notificationFilters = () => ({
    ...(notificationTypeFilter ? { type: notificationTypeFilter } : {}),
    ...(notificationReadFilter ? { read: notificationReadFilter === "read" } : {}),
    ...(notificationRecipientFilter.trim() ? { recipientId: Number(notificationRecipientFilter) } : {}),
  });
  const filterNotifications = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const { data } = await getAdminNotifications(notificationFilters()); setNotifications(data.content); }
    catch { setError(true); }
  };
  const markFilteredNotificationsRead = async () => {
    try { await markAdminNotificationsRead({ type: notificationTypeFilter || undefined, recipientId: notificationRecipientFilter.trim() ? Number(notificationRecipientFilter) : undefined }); const { data } = await getAdminNotifications(notificationFilters()); setNotifications(data.content); }
    catch { setError(true); }
  };
  const deleteFilteredNotifications = async () => {
    if (!window.confirm(t("deleteFilteredNotificationsConfirm"))) return;
    try { await deleteAdminNotifications(notificationFilters()); const { data } = await getAdminNotifications(notificationFilters()); setNotifications(data.content); }
    catch { setError(true); }
  };
  const createNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const { data } = await createAdminNotification({ ...notificationDraft, recipientId: Number(notificationDraft.recipientId), actorId: notificationDraft.actorId || null, relatedUserId: notificationDraft.relatedUserId || null, reviewId: notificationDraft.reviewId || null }); setNotifications(current => [data, ...current]); setNotificationDraft({ recipientId: 0, type: "FOLLOW", actorId: null, relatedUserId: null, reviewId: null }); }
    catch { setError(true); }
  };
  const saveSetting = async (setting: AdminSetting) => {
    try { const { data } = await updateAdminSetting(setting.key, setting.value); setSettings(current => current.map(item => item.key === data.key ? data : item)); }
    catch { setError(true); }
  };
  const resetMovieDraft = () => { setEditingMovieId(null); setMovieDraft({ title: "", releaseDate: "", rating: null, photoUrl: "" }); };
  const editMovie = (movie: AdminMovie) => { setEditingMovieId(movie.id); setMovieDraft({ title: movie.title, releaseDate: movie.releaseDate ?? "", rating: movie.rating, photoUrl: movie.photoUrl ?? "" }); };
  const saveMovie = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = { ...movieDraft, title: movieDraft.title.trim(), releaseDate: movieDraft.releaseDate || null, photoUrl: movieDraft.photoUrl || null };
      const { data } = editingMovieId === null ? await createAdminMovie(payload) : await updateAdminMovie(editingMovieId, payload);
      setMovies(current => editingMovieId === null ? [data, ...current] : current.map(item => item.id === data.id ? data : item));
      resetMovieDraft();
    } catch { setError(true); }
  };
  const removeMovie = async (movie: AdminMovie) => {
    if (!window.confirm(`${t("deleteMovieConfirm")} ${movie.title}?`)) return;
    try { await deleteAdminMovie(movie.id); setMovies(current => current.filter(item => item.id !== movie.id)); }
    catch { setError(true); }
  };
  const syncMovie = async (movie: AdminMovie) => {
    const tmdbId = Number.parseInt(tmdbIds[movie.id] ?? "", 10);
    if (!Number.isInteger(tmdbId) || tmdbId < 1) { setSyncMessage(t("tmdbIdRequired")); return; }
    setSyncingMovieId(movie.id); setSyncMessage(null);
    try {
      const { data } = await syncAdminMovieTmdb(movie.id, tmdbId);
      setSyncMessage(`${t("tmdbSyncDone")}: ${data.title} · ${data.genresUpdated} ${t("genres")} · ${data.actorsUpdated} ${t("actors")} · ${data.directorsUpdated} ${t("directors")}`);
      const { data: refreshed } = await getAdminMovies();
      setMovies(refreshed.content);
      setTmdbIds(current => ({ ...current, [movie.id]: String(data.tmdbId) }));
    } catch { setError(true); setSyncMessage(t("tmdbSyncError")); }
    finally { setSyncingMovieId(null); }
  };
  const refreshAdminMovies = async () => {
    const { data } = await getAdminMovies();
    setMovies(data.content);
    setTmdbIds(Object.fromEntries(data.content.filter(movie => movie.tmdbId !== null).map(movie => [movie.id, String(movie.tmdbId)])));
  };
  const parseTmdbIds = (value: string) => [...new Set(value.split(/[\s,]+/).map(item => Number.parseInt(item, 10)).filter(id => Number.isInteger(id) && id > 0))];
  const importTmdbIds = async (event: React.FormEvent) => {
    event.preventDefault();
    const ids = parseTmdbIds(tmdbImportIds);
    if (ids.length === 0 || ids.length > 20) { setTmdbImportMessage(t("tmdbImportLimit")); return; }
    setTmdbImportBusy(true); setTmdbImportMessage(null);
    try {
      const { data } = await importAdminTmdb(ids);
      setTmdbImportMessage(`${t("tmdbImportDone")}: ${data.succeeded}/${data.requested}`);
      await refreshAdminMovies();
    } catch { setError(true); setTmdbImportMessage(t("tmdbImportError")); }
    finally { setTmdbImportBusy(false); }
  };
  const discoverAndImportTmdb = async (event: React.FormEvent) => {
    event.preventDefault();
    const page = Number.parseInt(tmdbDiscoveryDraft.page, 10);
    const limit = Number.parseInt(tmdbDiscoveryDraft.limit, 10);
    if (!Number.isInteger(page) || page < 1 || page > 500 || !Number.isInteger(limit) || limit < 1 || limit > 20) {
      setTmdbImportMessage(t("tmdbDiscoveryInvalid")); return;
    }
    const request: TmdbDiscoveryRequest = { page, limit, ...(tmdbDiscoveryDraft.year ? { year: Number(tmdbDiscoveryDraft.year) } : {}), ...(tmdbDiscoveryDraft.genreId ? { genreId: Number(tmdbDiscoveryDraft.genreId) } : {}), ...(tmdbDiscoveryDraft.minRating ? { minRating: Number(tmdbDiscoveryDraft.minRating) } : {}) };
    setTmdbImportBusy(true); setTmdbImportMessage(null);
    try {
      const { data } = await discoverAndImportAdminTmdb(request);
      setTmdbImportMessage(`${t("tmdbDiscoveryDone")}: ${data.imports.succeeded}/${data.discovered} · ${t("page")} ${data.page}/${data.totalPages}`);
      await refreshAdminMovies();
    } catch { setError(true); setTmdbImportMessage(t("tmdbImportError")); }
    finally { setTmdbImportBusy(false); }
  };
  const publishArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const { data } = await createAdminArticle(article); setArticles(current => [data, ...current]); setArticle(current => ({ ...current, slug: "", title: "", excerpt: "", content: "", coverUrl: "", audioUrl: "" })); }
    catch { setError(true); }
  };
  const sendNewsletter = async (item: AdminArticle) => {
    if (!item.publishedAt || newsletterBusyId !== null) return;
    setNewsletterBusyId(item.id);
    try {
      await queueAdminNewsletter(item.id);
      const { data } = await getAdminNewsletterStatus(item.id);
      setNewsletterStatuses(current => ({ ...current, [item.id]: data }));
    } catch { setError(true); }
    finally { setNewsletterBusyId(null); }
  };
  const hideModerationItem = async (item: AdminModerationQueueItem) => {
    try { await hideAdminModerationItem(item); setModerationQueue(current => current.filter(entry => !(entry.type === item.type && entry.id === item.id))); }
    catch { setError(true); }
  };
  const moderationFilters = () => ({
    ...(moderationTypeFilter ? { type: moderationTypeFilter } : {}),
    ...(moderationQuery.trim() ? { query: moderationQuery.trim() } : {}),
  });
  const filterModeration = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const { data } = await getAdminModerationQueue(moderationFilters()); setModerationQueue(data.content); setSelectedModeration([]); }
    catch { setError(true); }
  };
  const toggleModerationSelection = (item: AdminModerationQueueItem) => {
    const key = `${item.type}:${item.id}`;
    setSelectedModeration(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]);
  };
  const selectAllModeration = () => setSelectedModeration(moderationQueue.map(item => `${item.type}:${item.id}`));
  const hideSelectedModeration = async () => {
    const selected = moderationQueue.filter(item => selectedModeration.includes(`${item.type}:${item.id}`));
    if (selected.length === 0 || !window.confirm(t("hideSelectedModerationConfirm"))) return;
    try { await bulkHideAdminModeration(selected, moderationReason.trim() || t("moderationDefaultReason")); setModerationQueue(current => current.filter(item => !selectedModeration.includes(`${item.type}:${item.id}`))); setSelectedModeration([]); }
    catch { setError(true); }
  };
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("adminDashboard")}</h1>
    {error && <p role="alert">{t("adminLoadError")}</p>}
    {dashboard && <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12 }}>
      {([["users", dashboard.users], ["activeUsers", dashboard.activeUsers], ["hqUsers", dashboard.hqUsers], ["movies", dashboard.movies], ["reviews", dashboard.reviews], ["hiddenReviews", dashboard.hiddenReviews]] as const).map(([key, value]) => <div key={key} style={{ padding: 14, border: "1px solid #444", borderRadius: 8 }}><strong>{t(key)}</strong><div style={{ fontSize: 24 }}>{value}</div></div>)}
    </section>}
    <section><h2>{t("adminUsers")}</h2><form onSubmit={searchUsers} style={{ display: "flex", gap: 8, marginBottom: 12 }}><input aria-label={t("userSearch")} placeholder={t("userSearch")} value={userQuery} onChange={event => setUserQuery(event.target.value)} /><button type="submit">{t("search")}</button></form><ul>{users.map(target => <li key={target.id} style={{ marginBottom: 8 }}>{target.displayName || target.username} · {target.role} · {target.isActive ? t("activeUser") : t("blockedUser")} <button type="button" onClick={() => { void toggleHq(target); }}>{target.isHq ? t("revokeHq") : t("grantHq")}</button> <button type="button" onClick={() => { void toggleUserActive(target); }}>{target.isActive ? t("blockUser") : t("activateUser")}</button></li>)}</ul></section>
    <section><h2>{t("adminComments")}</h2><ul>{comments.map(comment => <li key={comment.id} style={{ marginBottom: 8 }}>{comment.username}: {comment.content} · {comment.isHidden ? t("hiddenComment") : t("visibleComment")} <button type="button" onClick={() => { void toggleComment(comment); }}>{comment.isHidden ? t("unhideComment") : t("hideComment")}</button></li>)}</ul></section>
    <section><h2>{t("adminReviews")}</h2><ul>{reviews.map(review => <li key={review.id} style={{ marginBottom: 8 }}>{review.movieTitle} · {review.username}: {review.content} · {review.isHidden ? t("hiddenReview") : t("visibleReview")} <button type="button" onClick={() => { void toggleReview(review); }}>{review.isHidden ? t("unhideReview") : t("hideReview")}</button></li>)}</ul></section>
    <section><h2>{t("moderationQueue")}</h2><form onSubmit={filterModeration} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}><select aria-label={t("moderationTypeFilter")} value={moderationTypeFilter} onChange={event => setModerationTypeFilter(event.target.value as "" | AdminModerationQueueItem["type"])}><option value="">{t("allModerationTypes")}</option><option value="REVIEW">{t("moderationReview")}</option><option value="COMMENT">{t("moderationComment")}</option></select><input aria-label={t("moderationSearch")} placeholder={t("moderationSearch")} value={moderationQuery} onChange={event => setModerationQuery(event.target.value)} /><button type="submit">{t("filterModeration")}</button><button type="button" onClick={selectAllModeration}>{t("selectAllModeration")}</button><input aria-label={t("moderationReason")} placeholder={t("moderationReason")} value={moderationReason} onChange={event => setModerationReason(event.target.value)} /><button type="button" disabled={selectedModeration.length === 0} onClick={() => { void hideSelectedModeration(); }}>{t("hideSelectedModeration")} ({selectedModeration.length})</button></form>{moderationQueue.length === 0 ? <p>{t("noModerationItems")}</p> : <ul>{moderationQueue.map(item => { const key = `${item.type}:${item.id}`; return <li key={key} style={{ marginBottom: 8 }}><label><input type="checkbox" checked={selectedModeration.includes(key)} onChange={() => toggleModerationSelection(item)} /> {item.type === "REVIEW" ? t("moderationReview") : t("moderationComment")} · {item.subject} · {item.username}: {item.content}</label> <button type="button" onClick={() => { void hideModerationItem(item); }}>{t("hideComment")}</button></li>; })}</ul>}</section>
    <section><h2>{t("adminSettings")}</h2>{settings.length === 0 ? <p>{t("noAdminSettings")}</p> : <ul>{settings.map(setting => <li key={setting.key} style={{ marginBottom: 8 }}><label>{setting.key} <input value={setting.value} onChange={event => setSettings(current => current.map(item => item.key === setting.key ? { ...item, value: event.target.value } : item))} /></label> <button type="button" onClick={() => { void saveSetting(setting); }}>{t("saveSetting")}</button></li>)}</ul>}</section>
    <section><h2>{t("adminMovies")}</h2><form onSubmit={saveMovie} style={{ display: "grid", gap: 8, maxWidth: 700, marginBottom: 16 }}><label>{t("movieTitle")}<input required maxLength={255} value={movieDraft.title} onChange={event => setMovieDraft({ ...movieDraft, title: event.target.value })} /></label><label>{t("releaseDate")}<input type="date" value={movieDraft.releaseDate ?? ""} onChange={event => setMovieDraft({ ...movieDraft, releaseDate: event.target.value })} /></label><label>{t("rating")}<input type="number" min="0" max="10" step="0.1" value={movieDraft.rating ?? ""} onChange={event => setMovieDraft({ ...movieDraft, rating: event.target.value === "" ? null : Number(event.target.value) })} /></label><label>{t("posterUrl")}<input type="url" value={movieDraft.photoUrl ?? ""} onChange={event => setMovieDraft({ ...movieDraft, photoUrl: event.target.value })} /></label><div><button type="submit">{editingMovieId === null ? t("create") : t("save")}</button>{editingMovieId !== null && <button type="button" onClick={resetMovieDraft}>{t("cancel")}</button>}</div></form><div style={{ display: "grid", gap: 12, maxWidth: 700, marginBottom: 16, padding: 12, border: "1px solid #444", borderRadius: 8 }}><h3>{t("tmdbImportTitle")}</h3><form onSubmit={importTmdbIds} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><label>{t("tmdbIds")}<input aria-label={t("tmdbIds")} placeholder="550, 603" value={tmdbImportIds} onChange={event => setTmdbImportIds(event.target.value)} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbImport")}</button></form><form onSubmit={discoverAndImportTmdb} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><label>{t("page")}<input type="number" min="1" max="500" value={tmdbDiscoveryDraft.page} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, page: event.target.value })} /></label><label>{t("year")}<input type="number" min="1888" max="2100" value={tmdbDiscoveryDraft.year} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, year: event.target.value })} /></label><label>{t("genre")}<input type="number" min="1" value={tmdbDiscoveryDraft.genreId} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, genreId: event.target.value })} /></label><label>{t("minRating")}<input type="number" min="0" max="10" step="0.1" value={tmdbDiscoveryDraft.minRating} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, minRating: event.target.value })} /></label><label>{t("limit")}<input type="number" min="1" max="20" value={tmdbDiscoveryDraft.limit} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, limit: event.target.value })} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbDiscoveryImport")}</button></form>{tmdbImportMessage && <p role="status">{tmdbImportMessage}</p>}</div>{syncMessage && <p role="status">{syncMessage}</p>}<ul>{movies.map(movie => <li key={movie.id} style={{ marginBottom: 12 }}>{movie.title} · {movie.releaseDate || "—"} · {movie.rating ?? "—"} <button type="button" onClick={() => editMovie(movie)}>{t("editMovie")}</button> <button type="button" onClick={() => { void removeMovie(movie); }}>{t("deleteMovie")}</button><div style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}><label>{t("tmdbId")}<input inputMode="numeric" pattern="[0-9]*" aria-label={`${t("tmdbId")} ${movie.title}`} value={tmdbIds[movie.id] ?? ""} onChange={event => setTmdbIds(current => ({ ...current, [movie.id]: event.target.value }))} style={{ width: 90 }} /></label><button type="button" disabled={syncingMovieId === movie.id} onClick={() => { void syncMovie(movie); }}>{syncingMovieId === movie.id ? t("loading") : t("syncTmdb")}</button></div></li>)}</ul></section>
    <section><h2>{t("adminLists")}</h2><ul>{lists.map(list => <li key={list.id} style={{ marginBottom: 8 }}>{list.name} · {list.username} · {list.itemCount} {t("items")} · {list.isPublic ? t("publicList") : t("hiddenList")} <button type="button" onClick={() => { void toggleList(list); }}>{list.isPublic ? t("hideList") : t("publishList")}</button>{list.listType === "CUSTOM" && <button type="button" onClick={() => { void removeList(list); }}>{t("deleteList")}</button>}</li>)}</ul></section>
    <section><h2>{t("adminConversations")}</h2><ul>{conversations.map(conversation => <li key={conversation.id}>{t("conversationUsers")} #{conversation.userOneId} / #{conversation.userTwoId} · {conversation.messageCount} {t("messagesCount")} · {new Date(conversation.updatedAt).toLocaleString()} <button type="button" onClick={() => { void removeConversation(conversation); }}>{t("deleteConversation")}</button></li>)}</ul></section>
    <section><h2>{t("adminNotifications")}</h2><form onSubmit={createNotification} style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 12 }}><input required min="1" type="number" aria-label={t("notificationRecipientId")} placeholder={t("notificationRecipientId")} value={notificationDraft.recipientId || ""} onChange={event => setNotificationDraft({ ...notificationDraft, recipientId: Number(event.target.value) })} /><select aria-label={t("notificationType")} value={notificationDraft.type} onChange={event => setNotificationDraft({ ...notificationDraft, type: event.target.value as AdminNotificationWrite["type"] })}><option value="FOLLOW">FOLLOW</option><option value="REVIEW_LIKED">REVIEW_LIKED</option></select><input min="1" type="number" aria-label={t("notificationActorId")} placeholder={t("notificationActorId")} value={notificationDraft.actorId || ""} onChange={event => setNotificationDraft({ ...notificationDraft, actorId: event.target.value ? Number(event.target.value) : null })} /><input min="1" type="number" aria-label={t("notificationReviewId")} placeholder={t("notificationReviewId")} value={notificationDraft.reviewId || ""} onChange={event => setNotificationDraft({ ...notificationDraft, reviewId: event.target.value ? Number(event.target.value) : null })} /><button type="submit">{t("createNotification")}</button></form><form onSubmit={filterNotifications} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}><select aria-label={t("notificationTypeFilter")} value={notificationTypeFilter} onChange={event => setNotificationTypeFilter(event.target.value as "" | AdminNotificationWrite["type"])}><option value="">{t("allNotificationTypes")}</option><option value="FOLLOW">FOLLOW</option><option value="REVIEW_LIKED">REVIEW_LIKED</option></select><select aria-label={t("notificationReadFilter")} value={notificationReadFilter} onChange={event => setNotificationReadFilter(event.target.value as "" | "read" | "unread")}><option value="">{t("allNotificationStates")}</option><option value="read">{t("read")}</option><option value="unread">{t("unread")}</option></select><input type="number" min="1" aria-label={t("notificationRecipientFilter")} placeholder={t("notificationRecipientFilter")} value={notificationRecipientFilter} onChange={event => setNotificationRecipientFilter(event.target.value)} /><button type="submit">{t("filterNotifications")}</button><button type="button" onClick={() => { void markFilteredNotificationsRead(); }}>{t("markFilteredNotificationsRead")}</button><button type="button" onClick={() => { void deleteFilteredNotifications(); }}>{t("deleteFilteredNotifications")}</button></form><ul>{notifications.map(notification => <li key={notification.id}>{notification.type} · {t("notificationRecipient")} #{notification.recipientId} · {notification.actorId ? `${t("notificationActor")} #${notification.actorId}` : ""} · {notification.readAt ? t("read") : t("unread")} <button type="button" onClick={() => { void toggleNotificationRead(notification); }}>{notification.readAt ? t("markNotificationUnread") : t("markNotificationRead")}</button> <button type="button" onClick={() => { void removeNotification(notification); }}>{t("deleteNotification")}</button></li>)}</ul></section>
    <section><h2>{t("journalEditor")}</h2><form onSubmit={publishArticle} style={{ display: "grid", gap: 8, maxWidth: 700 }}><input required placeholder={t("articleSlug")} value={article.slug} onChange={event => setArticle({ ...article, slug: event.target.value })} /><input required placeholder={t("articleTitle")} value={article.title} onChange={event => setArticle({ ...article, title: event.target.value })} /><input required placeholder={t("articleCategory")} value={article.category} onChange={event => setArticle({ ...article, category: event.target.value })} /><select value={article.language} onChange={event => setArticle({ ...article, language: event.target.value })}><option value="uk">Українська</option><option value="en">English</option></select><input placeholder={t("articleExcerpt")} value={article.excerpt} onChange={event => setArticle({ ...article, excerpt: event.target.value })} /><input type="url" placeholder={t("audioUrl")} value={article.audioUrl} onChange={event => setArticle({ ...article, audioUrl: event.target.value })} /><textarea required placeholder={t("articleContent")} value={article.content} onChange={event => setArticle({ ...article, content: event.target.value })} rows={8} /><label><input type="checkbox" checked={article.published} onChange={event => setArticle({ ...article, published: event.target.checked })} /> {t("publishArticle")}</label><button type="submit">{t("create")}</button></form><ul>{articles.map(item => { const status = newsletterStatuses[item.id]; return <li key={item.id}>{item.language} · {item.title}{item.audioUrl && ` · ${t("podcastAudio")}`} {item.publishedAt && <><button type="button" disabled={newsletterBusyId !== null} onClick={() => { void sendNewsletter(item); }}>{newsletterBusyId === item.id ? t("loading") : t("sendNewsletter")}</button>{status && ` · ${t("newsletterQueueStatus")}: ${status.pending}/${status.sent}/${status.failed}`}</>}</li>; })}</ul></section>
    <section><h2>{t("auditLogs")}</h2>{logs.length === 0 ? <p>{t("noAuditLogs")}</p> : <ul>{logs.map(log => <li key={log.id}>{log.action} · {log.targetType} #{log.targetId ?? "—"} · {new Date(log.createdAt).toLocaleString()}</li>)}</ul>}</section>
  </main>;
}
