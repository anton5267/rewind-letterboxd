import { useState } from "react";
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

export default function Comments({ reviewId }: { reviewId: number }) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getComments(reviewId);
      setComments((data as Page<Comment>).content);
      setError("");
    } catch { setError(t("loadCommentsError")); }
    finally { setLoading(false); }
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
    try { await deleteComment(id); await load(); }
    catch { setError(t("deleteCommentError")); }
  };

  return <section style={{ marginTop: 12 }}>
    <button type="button" onClick={toggle} aria-expanded={expanded}>{expanded ? t("hideComments") : t("showComments")}</button>
    {expanded && <div style={{ marginTop: 10 }}>
      {loading && <p>{t("loading")}</p>}
      {error && <p role="alert">{error}</p>}
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
      {isAuth ? <form onSubmit={submit}>
        <label>{t("yourComment")}<br /><textarea required maxLength={2000} value={editing === null ? text : ""} disabled={editing !== null} onChange={event => setText(event.target.value)} /></label>{" "}
        {editing === null && <button type="submit">{t("sendComment")}</button>}
      </form> : <p>{t("loginToComment")}</p>}
    </div>}
  </section>;
}
