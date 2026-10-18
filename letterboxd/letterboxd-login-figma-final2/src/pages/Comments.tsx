import { useRef, useState } from "react";
import { addComment, deleteComment, getComments, updateComment } from "../api/comments.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface Comment {
  id: number;
  userId: number;
  username: string;
  text: string;
}
interface Page<T> { content: T[] }
interface CommentPage extends Page<Comment> { number: number; totalPages: number; totalElements: number }

export default function Comments({ reviewId }: { reviewId: number }) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      setError("");
    } catch {
      if (currentRequest === requestId.current) setError(t("loadCommentsError"));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void load();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      if (editing !== null) await updateComment(editing, value);
      else await addComment(reviewId, value);
      setText("");
      setEditing(null);
      await load();
    } catch { setError(editing !== null ? t("updateCommentError") : t("createCommentError")); }
  };

  const remove = async (id: number) => {
    if (!window.confirm(t("deleteCommentConfirm"))) return;
    try {
      await deleteComment(id);
      await load(page > 0 && comments.length === 1 ? page - 1 : page);
    }
    catch { setError(t("deleteCommentError")); }
  };

  return <section style={{ marginTop: 12 }}>
    <button type="button" onClick={toggle} aria-expanded={expanded}>{expanded ? t("hideComments") : t("showComments")}</button>
    {expanded && <div style={{ marginTop: 10 }}>
      {loading && <p>{t("loading")}</p>}
      {error && <p role="alert">{error} <button type="button" onClick={() => void load()} disabled={loading}>{t("retry")}</button></p>}
      {!loading && !error && comments.length === 0 && <p>{t("noComments")}</p>}
      <ul style={{ paddingLeft: 18 }}>
        {comments.map(comment => {
          const canChange = isAuth && (comment.userId === user?.id || user?.role === "ADMIN");
          const isEditing = editing === comment.id;
          return <li key={comment.id} style={{ marginTop: 8 }}>
            <strong>{comment.username}</strong>{isEditing ? <form onSubmit={submit}>
              <textarea aria-label={t("editComment")} required maxLength={2000} value={text} onChange={event => setText(event.target.value)} />
              <button type="submit">{t("save")}</button>{" "}
              <button type="button" onClick={() => { setEditing(null); setText(""); }}>{t("cancel")}</button>
            </form> : <p>{comment.text}</p>}
            {canChange && !isEditing && <><button type="button" onClick={() => { setEditing(comment.id); setText(comment.text); }}>{t("editComment")}</button>{" "}<button type="button" onClick={() => void remove(comment.id)}>{t("deleteComment")}</button></>}
          </li>;
        })}
      </ul>
      {!loading && !error && totalPages > 1 && <nav aria-label={t("commentsPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={page === 0} onClick={() => void load(page - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => void load(page + 1)}>{t("next")}</button>
      </nav>}
      {isAuth ? <form onSubmit={submit}>
        <label>{t("yourComment")}<br /><textarea required maxLength={2000} value={editing === null ? text : ""} disabled={editing !== null} onChange={event => setText(event.target.value)} /></label>{" "}
        {editing === null && <button type="submit">{t("sendComment")}</button>}
      </form> : <p>{t("loginToComment")}</p>}
    </div>}
  </section>;
}
