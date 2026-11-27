import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addAdminListMovie, deleteAdminList, dismissAdminListReport, getAdminListDetails, getAdminMovies, setAdminListVisibility, setAdminUserActive, updateAdminListDetails, type AdminListDetails, type AdminMovieCatalog, type AuditLog } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import RetryNotice from "./RetryNotice";
import { formatDateTime, formatReviewDate, localizeAuditAction, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminListDetail.module.css";

export default function AdminListDetail() {
  const [params] = useSearchParams();
  const { lang, path, t } = useLocale();
  const listId = Number(params.get("listId"));
  const reportId = params.has("reportId") ? Number(params.get("reportId")) : undefined;
  const validIds = Number.isSafeInteger(listId) && listId > 0 && (reportId === undefined || (Number.isSafeInteger(reportId) && reportId > 0));
  const [list, setList] = useState<AdminListDetails | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [films, setFilms] = useState<AdminListDetails["films"]>([]);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [receipt, setReceipt] = useState<"resolved" | "blocked" | "deleted" | null>(null);
  const [message, setMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminMovieCatalog[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickerError, setPickerError] = useState(false);
  const picker = useRef<HTMLDialogElement>(null);
  const receiptMessage = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let current = true;
    setLoading(true); setError(false); setList(null); setReceipt(null); setMessage("");
    if (!validIds) { setError(true); setLoading(false); return () => { current = false; }; }
    getAdminListDetails(listId, reportId).then(({ data }) => {
      if (!current) return;
      setList(data); setName(data.name); setDescription(data.description ?? ""); setFilms(data.films); setHistory(data.history);
    }).catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [listId, reportId, attempt, lang, validIds]);

  useEffect(() => {
    if (!pickerOpen) return;
    let current = true;
    const timer = window.setTimeout(() => {
      setSearching(true); setPickerError(false);
      getAdminMovies(0, 8, query.trim()).then(({ data }) => { if (current) setResults(data.content.filter(movie => movie.published)); })
        .catch(() => { if (current) setPickerError(true); }).finally(() => { if (current) setSearching(false); });
    }, 180);
    return () => { current = false; window.clearTimeout(timer); };
  }, [pickerOpen, query]);

  useEffect(() => {
    if (pickerOpen && picker.current && !picker.current.open) picker.current.showModal();
    if (!pickerOpen && picker.current?.open) picker.current.close();
  }, [pickerOpen]);

  useEffect(() => {
    if (receipt) { window.scrollTo({ top: 0, behavior: "instant" }); receiptMessage.current?.focus({ preventScroll: true }); }
  }, [receipt]);

  const perform = async (action: "save" | "status" | "resolve" | "block" | "delete") => {
    if (!list || busy) return;
    if (action === "delete" && !window.confirm(t("adminListDeleteConfirm"))) return;
    if (action === "block" && !window.confirm(t("adminListBlockConfirm"))) return;
    if (action === "save" && (!name.trim() || name.trim().length > 100 || description.length > 2000 || (name.trim() === list.name && description === (list.description ?? "")))) return;
    setBusy(true); setError(false); setMessage("");
    try {
      if (action === "save") {
        const updated = await updateAdminListDetails(list.id, { name: name.trim(), description: description.trim() || null });
        setList(updated.data); setName(updated.data.name); setDescription(updated.data.description ?? ""); setHistory(updated.data.history); setEditing(false); setMessage(t("adminListSaved"));
      } else if (action === "status") {
        const updated = await setAdminListVisibility(list.id, !list.isPublic);
        setList(current => current ? { ...current, ...updated.data } : current); setMessage(t("adminListStatusSaved"));
      } else if (action === "resolve") {
        if (!list.report) return;
        await dismissAdminListReport(list.report.id); setReceipt("resolved");
      } else if (action === "block") {
        if (!list.ownerIsActive) { setMessage(t("adminListOwnerBlocked")); return; }
        await setAdminUserActive(list.userId, false); setList(current => current ? { ...current, ownerIsActive: false } : current); setReceipt("blocked");
      } else {
        await deleteAdminList(list.id); setReceipt("deleted");
      }
    } catch { setMessage(action === "save" ? t("adminListSaveError") : t("adminListActionError")); }
    finally { setBusy(false); }
  };

  const addFilm = async (movie: AdminMovieCatalog) => {
    if (!list || busy) return;
    setBusy(true); setPickerError(false);
    try {
      const updated = await addAdminListMovie(list.id, movie.id);
      setList(updated.data); setFilms(updated.data.films); setHistory(updated.data.history); setPickerOpen(false); setQuery(""); setMessage(t("adminListAdded"));
    } catch { setPickerError(true); }
    finally { setBusy(false); }
  };

  const title = list?.report ? t("adminReportedListDetailTitle") : t("adminListDetailTitle");
  if (receipt) return <section className={`${styles.workspace} ${styles.receiptWorkspace}`} aria-label={title}>
    <p ref={receiptMessage} className={styles.success} role="status" tabIndex={-1}>{t(receipt === "resolved" ? "adminListResolved" : receipt === "blocked" ? "adminListBlocked" : "adminListDeleted")}</p>
    <Link className={styles.back} to={`${path("/admin")}?view=${receipt === "resolved" ? "reported-reviews" : "lists"}`}>{t("adminBackToPage")}</Link>
  </section>;

  return <section className={styles.workspace} aria-label={title} aria-busy={loading || busy}>
    <h2>{title}</h2>
    {message && <p role="status" className={message.includes("Не вдалося") || message.includes("Could not") ? styles.error : styles.status}>{message}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminListLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading || busy} onRetry={() => setAttempt(value => value + 1)} />}
    {loading ? <AdminLoading label={t("loading")} layout="detail" /> : list ? <div className={`${styles.card} ${list.report ? styles.reportedCard : styles.regularCard}`}>
      <div className={styles.fields}>
        <Field label={t("adminListAuthor")} value={getUserName({ username: list.username }, t("someone"))} />
        <Field label={t("adminListYear")} value={formatReviewDate(list.createdAt, lang)} />
        <div className={styles.listNameField}>
          {editing ? <input aria-label={t("listName")} maxLength={100} value={name} disabled={busy} onChange={event => setName(event.target.value)} /> : <strong>{name}</strong>}
        </div>
        <div className={`${styles.field} ${styles.statusField}`}><h3>{t("adminListStatus")}</h3><div className={styles.statusControl}><span>{list.isPublic ? t("adminListPublished") : t("adminListHidden")}</span><button type="button" disabled={busy || list.listType !== "CUSTOM"} onClick={() => void perform("status")}>{t("adminListChangeStatus")}</button></div></div>
      </div>
      <div className={styles.listText}>
        <h3>{t("adminListText")}</h3>
        <textarea aria-label={t("adminListText")} maxLength={2000} value={description} readOnly={!editing} disabled={busy} onChange={event => setDescription(event.target.value)} />
        <div className={styles.textActions}><button type="button" disabled={busy || (editing && (!name.trim() || (name.trim() === list.name && description === (list.description ?? ""))))} onClick={() => editing ? void perform("save") : setEditing(true)}>{editing ? t("adminListSaveText") : t("adminListChangeText")}</button>{editing && <button type="button" disabled={busy} onClick={() => { setName(list.name); setDescription(list.description ?? ""); setEditing(false); }}>{t("cancel")}</button>}</div>
      </div>
      {list.report && <div className={styles.reportFields}><Field label={t("adminListReportedReason")} value={t(`reviewReportReason_${list.report.reason}`)} /><Field label={t("adminListComplaints")} value={String(list.reportCount)} /></div>}
      <div className={styles.films}><div className={styles.sectionHeading}><h3>{t("adminListFilms")}</h3></div><div className={styles.filmItems}><div className={styles.posterRow}>{films.map(film => <figure key={film.id}>{film.photoUrl ? <img src={film.photoUrl} alt={film.title} /> : <span className={styles.posterPlaceholder} role="img" aria-label={film.title} />}</figure>)}</div><button className={styles.addFilmButton} type="button" aria-label={t("adminListAddFilm")} disabled={busy || list.listType !== "CUSTOM"} onClick={() => setPickerOpen(true)}>+</button></div></div>
      <div className={styles.history}><h3>{t("adminListHistory")}</h3>{history.length ? <ul>{history.map(item => <li key={item.id}>{localizeAuditAction(item.action, lang)} · {formatDateTime(item.createdAt, lang)}</li>)}</ul> : <p>{t("adminListNoHistory")}</p>}</div>
      <div className={styles.actions}><button type="button" className={styles.delete} disabled={busy || list.listType !== "CUSTOM"} onClick={() => void perform("delete")}>{t("adminListDelete")}</button><button type="button" className={styles.block} disabled={busy || !list.ownerIsActive} onClick={() => void perform("block")}>{list.ownerIsActive ? t("adminListBlock") : t("adminListOwnerBlocked")}</button>{list.report && <button type="button" disabled={busy} onClick={() => void perform("resolve")}>{t("adminListResolve")}</button>}</div>
    </div> : !error && <p className={styles.empty}>{t("adminListMissing")}</p>}
    <dialog className={styles.dialog} ref={picker} aria-labelledby="admin-list-film-dialog-title" onCancel={event => { event.preventDefault(); setPickerOpen(false); }}>
      <h3 id="admin-list-film-dialog-title">{t("adminListAddFilmDialog")}</h3><label><span>{t("adminListSearchFilms")}</span><input type="search" autoFocus value={query} onChange={event => setQuery(event.target.value)} /></label>
      {pickerError && <p role="alert">{t("adminListFilmAddError")}</p>}{searching && <AdminLoading label={t("loading")} layout="detail" />}
      {!searching && results.length === 0 && <p>{t("adminListSearchEmpty")}</p>}
      <ul>{results.map(movie => <li key={movie.id}><button type="button" disabled={busy} onClick={() => void addFilm(movie)}>{movie.photoUrl && <img src={movie.photoUrl} alt="" />}<span>{movie.title}{movie.releaseDate ? ` (${movie.releaseDate.slice(0, 4)})` : ""}</span></button></li>)}</ul>
      <button type="button" onClick={() => setPickerOpen(false)}>{t("cancel")}</button>
    </dialog>
  </section>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className={styles.field}><h3>{label}</h3><p>{value}</p></div>;
}
