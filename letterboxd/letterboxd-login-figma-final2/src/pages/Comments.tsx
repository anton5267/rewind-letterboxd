import { useRef, useState } from "react";
import { addComment, deleteComment, getComments, updateComment } from "../api/comments.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import styles from "./Comments.module.css";

interface Comment {
  id: number;
  userId: number;
  username: string;
  text: string;
}
interface Page<T> { content: T[] }
interface CommentPage extends Page<Comment> { number: number; totalPages: number; totalElements: number }
type CommentAction = { type: "save"; commentId: number | null; text: string } | { type: "delete"; id: number };

export default function Comments({ reviewId }: { reviewId: number }) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<CommentAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutationBusy, setMutationBusy] = useState<"save" | "delete" | null>(null);
  const requestId = useRef(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async (requestedPage = page) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const { data } = await getComments(reviewId, requestedPage);
      if (currentRequest !== requestId.current) return;
      const response = data as CommentPage;
      setComments(response.content);
      setPage(response.number);
      setTotalPages(response.totalPages);
      setLoadError("");
    } catch {
      if (currentRequest === requestId.current) setLoadError(t("loadCommentsError"));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void load();
  };

  const saveComment = async (value: string, commentId: number | null) => {
    if (!value || mutationBusy) return;
    setMutationBusy("save");
    setActionError("");
    setPendingAction(null);
    try {
      if (commentId !== null) await updateComment(commentId, value);
      else await addComment(reviewId, value);
      setText("");
      setEditing(null);
      await load();
    } catch {
      setPendingAction({ type: "save", commentId, text: value });
      setActionError(commentId !== null ? t("updateCommentError") : t("createCommentError"));
    } finally {
      setMutationBusy(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveComment(text.trim(), editing);
  };

  const deleteCommentAction = async (id: number) => {
    if (mutationBusy) return;
    setMutationBusy("delete");
    setActionError("");
    setPendingAction(null);
    try {
      await deleteComment(id);
      await load(page > 0 && comments.length === 1 ? page - 1 : page);
    } catch {
      setPendingAction({ type: "delete", id });
      setActionError(t("deleteCommentError"));
    } finally {
      setMutationBusy(null);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm(t("deleteCommentConfirm"))) return;
    await deleteCommentAction(id);
  };

  const retryAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "save") void saveComment(pendingAction.text, pendingAction.commentId);
    else void deleteCommentAction(pendingAction.id);
  };

  return <section className={styles.section} aria-label={t("commentsSection")} aria-busy={loading || mutationBusy !== null}>
    <button type="button" onClick={toggle} aria-expanded={expanded}>{expanded ? t("hideComments") : t("showComments")}</button>
    {expanded && <div className={styles.panel}>
      {loading && <p role="status">{t("loading")}</p>}
      {loadError && <p className={styles.error} role="alert">{loadError} <button type="button" onClick={() => void load()} disabled={loading}>{t("retry")}</button></p>}
      {actionError && <p className={styles.error} role="alert">{actionError} <button type="button" onClick={retryAction} disabled={mutationBusy !== null}>{mutationBusy ? t("loading") : t("retry")}</button></p>}
      {!loading && !loadError && comments.length === 0 && <p>{t("noComments")}</p>}
      <ul className={styles.list}>
        {comments.map(comment => {
          const canChange = isAuth && (comment.userId === user?.id || user?.role === "ADMIN");
          const isEditing = editing === comment.id;
          return <li className={styles.item} key={comment.id}>
            <strong>{comment.username}</strong>{isEditing ? <form onSubmit={submit} aria-busy={mutationBusy === "save"}>
              <textarea className={styles.textarea} aria-label={t("editComment")} required maxLength={2000} value={text} disabled={mutationBusy !== null} onChange={event => setText(event.target.value)} />
              <button type="submit" aria-busy={mutationBusy === "save"} disabled={mutationBusy !== null}>{mutationBusy === "save" ? t("saving") : t("save")}</button>{" "}
              <button type="button" disabled={mutationBusy !== null} onClick={() => { setEditing(null); setText(""); }}>{t("cancel")}</button>
            </form> : <p className={styles.itemText}>{comment.text}</p>}
            {canChange && !isEditing && <><button type="button" disabled={mutationBusy !== null} onClick={() => { setEditing(comment.id); setText(comment.text); }}>{t("editComment")}</button>{" "}<button type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "delete"} onClick={() => void remove(comment.id)}>{mutationBusy === "delete" ? t("deleting") : t("deleteComment")}</button></>}
          </li>;
        })}
      </ul>
      {!loading && !loadError && totalPages > 1 && <nav className={styles.pagination} aria-label={t("commentsPagination")}>
        <button type="button" disabled={loading || mutationBusy !== null || page === 0} onClick={() => void load(page - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
        <button type="button" disabled={loading || mutationBusy !== null || page + 1 >= totalPages} onClick={() => void load(page + 1)}>{t("next")}</button>
      </nav>}
      {isAuth ? <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>{t("yourComment")}<textarea className={styles.textarea} required maxLength={2000} value={editing === null ? text : ""} disabled={editing !== null || mutationBusy !== null} onChange={event => setText(event.target.value)} /></label>
        {editing === null && <button type="submit" aria-busy={mutationBusy === "save"} disabled={mutationBusy !== null}>{mutationBusy === "save" ? t("saving") : t("sendComment")}</button>}
      </form> : <p>{t("loginToComment")}</p>}
    </div>}
  </section>;
}
