import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { addComment, addListComment, deleteComment, getComments, getListComments, updateComment, type Comment } from "../../api/comments.api";
import Pagination from "../Pagination";
import RetryNotice from "../RetryNotice";
import ConfirmDialog from "../ConfirmDialog";
import ContentReportAction from "../ContentReportAction";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../i18n";
import { getUserName } from "../../utils/userIdentity";
import styles from "./CommentThread.module.css";

type CommentAction = { type: "save"; commentId: number | null; text: string } | { type: "delete"; id: number };

type ThreadTarget = { reviewId: number; listId?: never } | { listId: number; reviewId?: never };

export default function CommentThread(props: ThreadTarget) {
  const { isAuth, user } = useAuth();
  const target = props.listId === undefined ? `review:${props.reviewId}` : `list:${props.listId}`;
  return <CommentThreadContent key={`${target}:${isAuth ? user?.id : "guest"}`} {...props} />;
}

function CommentThreadContent(props: ThreadTarget) {
  const targetId = props.listId ?? props.reviewId;
  const isList = props.listId !== undefined;
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
  const [pendingDelete, setPendingDelete] = useState<{ id: number; trigger: HTMLButtonElement } | null>(null);
  const requestId = useRef(0);
  const pendingLoadFocus = useRef<{ targetId: number; origin: HTMLElement | null } | null>(null);
  const pendingActionFocus = useRef<{ targetId: number; origin: HTMLElement | null } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mutationRequest = useRef(0);
  const currentReviewId = useRef(targetId);
  currentReviewId.current = targetId;
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => () => {
    requestId.current += 1;
    mutationRequest.current += 1;
  }, []);

  useEffect(() => {
    requestId.current += 1;
    mutationRequest.current += 1;
    setExpanded(false);
    setComments([]);
    setText("");
    setEditing(null);
    setLoadError("");
    setActionError("");
    setPendingAction(null);
    setLoading(false);
    setMutationBusy(null);
    setPage(0);
    setTotalPages(0);
    pendingLoadFocus.current = null;
    pendingActionFocus.current = null;
  }, [targetId]);

  useEffect(() => {
    const pending = pendingLoadFocus.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingLoadFocus.current !== pending) return;
      pendingLoadFocus.current = null;
      if (pending.targetId !== currentReviewId.current) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (loadError) panelRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else panelRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, loadError, comments, targetId]);

  useEffect(() => {
    const pending = pendingActionFocus.current;
    if (!pending || mutationBusy !== null || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingActionFocus.current !== pending) return;
      pendingActionFocus.current = null;
      if (pending.targetId !== currentReviewId.current) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (actionError) panelRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else panelRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [actionError, comments, loading, mutationBusy, targetId]);

  const retryLoad = () => {
    pendingLoadFocus.current = { targetId, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    void load();
  };

  const load = async (requestedPage = page) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const { data } = await (isList ? getListComments(targetId, requestedPage) : getComments(targetId, requestedPage));
      if (currentRequest !== requestId.current || currentReviewId.current !== targetId) return;
      setComments(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setLoadError("");
    } catch {
      if (currentRequest === requestId.current && currentReviewId.current === targetId) setLoadError(t("loadCommentsError"));
    } finally {
      if (currentRequest === requestId.current && currentReviewId.current === targetId) setLoading(false);
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void load();
  };

  const startMutation = (kind: "save" | "delete") => {
    if (mutationBusy || currentReviewId.current !== targetId) return null;
    const currentMutation = ++mutationRequest.current;
    setMutationBusy(kind);
    return currentMutation;
  };

  const isCurrentMutation = (currentMutation: number) =>
    currentMutation === mutationRequest.current && currentReviewId.current === targetId;

  const saveComment = async (value: string, commentId: number | null) => {
    if (!value.trim()) return;
    const currentMutation = startMutation("save");
    if (currentMutation === null) return;
    setActionError("");
    setPendingAction(null);
    try {
      if (commentId !== null) await updateComment(commentId, value);
      else if (isList) await addListComment(targetId, value);
      else await addComment(targetId, value);
      if (!isCurrentMutation(currentMutation)) return;
      setText("");
      setEditing(null);
      await load();
      if (!isCurrentMutation(currentMutation)) return;
    } catch (error) {
      if (!isCurrentMutation(currentMutation)) return;
      setPendingAction({ type: "save", commentId, text: value });
      const repliesRestricted = commentId === null && isAxiosError(error) && error.response?.status === 403;
      const message = repliesRestricted ? t(isList ? "listCommentRepliesRestricted" : "commentRepliesRestricted")
        : commentId !== null ? t("updateCommentError") : t("createCommentError");
      setActionError(message);
    } finally {
      if (isCurrentMutation(currentMutation)) setMutationBusy(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveComment(text.trim(), editing);
  };

  const deleteCommentAction = async (id: number) => {
    const currentMutation = startMutation("delete");
    if (currentMutation === null) return;
    setActionError("");
    setPendingAction(null);
    try {
      await deleteComment(id);
      if (!isCurrentMutation(currentMutation)) return;
      await load(page > 0 && comments.length === 1 ? page - 1 : page);
      if (!isCurrentMutation(currentMutation)) return;
    } catch {
      if (!isCurrentMutation(currentMutation)) return;
      setPendingAction({ type: "delete", id });
      setActionError(t("deleteCommentError"));
    } finally {
      if (isCurrentMutation(currentMutation)) setMutationBusy(null);
    }
  };

  const remove = (id: number, trigger: HTMLButtonElement) => {
    if (mutationBusy !== null) return;
    setPendingDelete({ id, trigger });
  };

  const retryAction = () => {
    if (!pendingAction) return;
    pendingActionFocus.current = { targetId, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    if (pendingAction.type === "save") void saveComment(pendingAction.text, pendingAction.commentId);
    else void deleteCommentAction(pendingAction.id);
  };

  return <section className={styles.section} aria-label={t("commentsSection")} aria-busy={loading || mutationBusy !== null}>
    <button type="button" onClick={toggle} aria-expanded={expanded}>{expanded ? t("hideComments") : t("showComments")}</button>
    {expanded && <div className={styles.panel} ref={panelRef} tabIndex={-1} data-comments-panel>
      {loading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {loadError && <RetryNotice className={styles.error} message={loadError} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={retryLoad} />}
      {actionError && <RetryNotice className={styles.error} message={actionError} retryLabel={mutationBusy ? t("loading") : t("retry")} disabled={mutationBusy !== null} busy={mutationBusy !== null} onRetry={retryAction} />}
      {!loading && !loadError && comments.length === 0 && <p>{t("noComments")}</p>}
      <ul className={styles.list}>
        {comments.map(comment => {
          const canEdit = isAuth && comment.userId === user?.id;
          const canDelete = isAuth && (canEdit || user?.role === "ADMIN");
          const isEditing = editing === comment.id;
          return <li className={styles.item} key={comment.id}>
            <strong>{getUserName({ username: comment.username }, t("someone"))}</strong>{isEditing ? <form onSubmit={submit} aria-busy={mutationBusy === "save"}>
              <textarea className={styles.textarea} aria-label={t("editComment")} required maxLength={2000} value={text} disabled={mutationBusy !== null} onChange={event => setText(event.target.value)} />
              <button type="submit" aria-busy={mutationBusy === "save"} disabled={mutationBusy !== null || !text.trim()}>{mutationBusy === "save" ? t("saving") : t("save")}</button>{" "}
              <button type="button" disabled={mutationBusy !== null} onClick={() => { setEditing(null); setText(""); }}>{t("cancel")}</button>
            </form> : <p className={styles.itemText}>{comment.text}</p>}
            {canDelete && !isEditing && <>{canEdit && <button type="button" disabled={mutationBusy !== null} onClick={() => { setEditing(comment.id); setText(comment.text); }}>{t("editComment")}</button>}{" "}<button type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "delete"} onClick={event => remove(comment.id, event.currentTarget)}>{mutationBusy === "delete" ? t("deleting") : t("deleteComment")}</button></>}
            {isAuth && comment.userId !== user?.id && <ContentReportAction key={`${user?.id}:${comment.id}`} type="comment" id={comment.id} />}
          </li>;
        })}
      </ul>
      {!loading && !loadError && <Pagination className={styles.pagination} page={page} totalPages={totalPages} label={t("commentsPagination")} busy={loading || mutationBusy !== null} onPageChange={requestedPage => void load(requestedPage)} />}
      {isAuth ? <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>{t("yourComment")}<textarea className={styles.textarea} required maxLength={2000} value={editing === null ? text : ""} disabled={editing !== null || mutationBusy !== null} onChange={event => setText(event.target.value)} /></label>
        {editing === null && <button type="submit" aria-busy={mutationBusy === "save"} disabled={mutationBusy !== null || !text.trim()}>{mutationBusy === "save" ? t("saving") : t("sendComment")}</button>}
      </form> : <p>{t("loginToComment")}</p>}
    </div>}
    <ConfirmDialog open={pendingDelete !== null} title={t("deleteComment")} description={t("deleteCommentConfirm")} cancelLabel={t("cancel")} confirmLabel={t("deleteComment")} trigger={pendingDelete?.trigger ?? null} onCancel={() => setPendingDelete(null)} onConfirm={() => { const id = pendingDelete?.id; setPendingDelete(null); if (id !== undefined) void deleteCommentAction(id); }} />
  </section>;
}
