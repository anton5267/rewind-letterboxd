import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLocale, editorialText, formatDateTime } from "../../i18n";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { getProfileReviews, type ProfileReview, type ProfilePage } from "../../api/profile.api";
import { getReviewDetails, updateReview, deleteReview as deleteReviewRequest } from "../../api/reviews.api";
import { isPageOutOfRange, getLastPageIndex } from "../../utils/pagination";
import styles from "../Profile.module.css";
import ResilientImage from "../../components/ResilientImage";
import ProfileReviewScore from "../../components/ProfileReviewScore";
import { type ProfileRoute } from "./profileRoute";
import { type ProfileIdentityModel } from "./useProfileIdentity";

export function useProfileReviews({ route, identity }: {
  route: Pick<ProfileRoute, "profileView" | "settingsTab" | "requestedReviewValue" | "requestedReviewId">;
  identity: Pick<ProfileIdentityModel, "profile" | "setProfile">;
}) {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { path, t, lang } = useLocale();
  const { profileView, settingsTab, requestedReviewValue, requestedReviewId } = route;
  const { profile, setProfile } = identity;

  const [reviewDetail, setReviewDetail] = useState<ProfileReview | null>(null);

  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);

  const [reviewDetailError, setReviewDetailError] = useState(false);

  const [reviewsHistory, setReviewsHistory] = useState<ProfilePage<ProfileReview> | null>(null);

  const [reviewsPage, setReviewsPage] = useState(0);

  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [reviewsError, setReviewsError] = useState(false);

  const [reviewsAttempt, setReviewsAttempt] = useState(0);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const [reviewDraft, setReviewDraft] = useState("");

  const [reviewActionBusy, setReviewActionBusy] = useState<"save" | "delete" | null>(null);

  const [pendingReviewDelete, setPendingReviewDelete] = useState<{ item: ProfileReview; trigger: HTMLButtonElement } | null>(null);

  const [reviewActionMessage, setReviewActionMessage] = useState<"reviewUpdated" | "reviewDeleted" | null>(null);

  const [reviewActionError, setReviewActionError] = useState<"updateReviewError" | "deleteReviewError" | null>(null);

  const reviewEditButtonRefs = useRef(new Map<number, HTMLButtonElement>());

  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);

  const reviewDetailMobileHeadingRef = useRef<HTMLHeadingElement>(null);

  const detailFocusPending = useRef(false);

  const detailRetryOrigin = useRef<HTMLElement | null>(null);

  const reviewErrorRef = useRef<HTMLParagraphElement>(null);

  const reviewMounted = useRef(false);

  const reviewScopeGeneration = useRef(0);

  const reviewsRequest = useRef(0);

  const reviewMutation = useRef<object | null>(null);

  const reviewActor = user?.id ?? null;

  const currentReviewActor = useRef(reviewActor);

  const pendingReviewFocus = useRef<{ scope: number; request: number; origin: HTMLElement | null; target: "edit" | "heading" | "error"; id?: number } | null>(null);

  const reviewPageCarry = useRef<{ page: number; lang: string; actor: number | null; focus: NonNullable<typeof pendingReviewFocus.current> } | null>(null);

  useLayoutEffect(() => {
    reviewMounted.current = true;
    return () => {
      reviewMounted.current = false;
      reviewScopeGeneration.current += 1;
      pendingReviewFocus.current = null;
      reviewMutation.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    reviewScopeGeneration.current += 1;
    detailRetryOrigin.current = null;
    const carry = reviewPageCarry.current;
    pendingReviewFocus.current = carry && profileView === "reviews" && !settingsTab && carry.page === reviewsPage && carry.lang === lang && carry.actor === reviewActor && pendingReviewFocus.current === carry.focus
      ? { ...carry.focus, scope: reviewScopeGeneration.current } : null;
    reviewPageCarry.current = null;
    setEditingReviewId(null);
    setReviewDraft("");
    setReviewActionMessage(null);
    setReviewActionError(null);
    if (currentReviewActor.current !== reviewActor) {
      reviewMutation.current = null;
      setReviewActionBusy(null);
    }
    currentReviewActor.current = reviewActor;
  }, [isAuth, user?.id, lang, settingsTab, profileView, reviewsPage, requestedReviewValue]);

  useEffect(() => {
    setReviewDetail(null);
    setReviewDetailError(false);
    if (requestedReviewValue === null) { setReviewDetailLoading(false); return; }
    if (!isAuth || !user?.id) return;
    if (requestedReviewId === null) { setReviewDetailLoading(false); setReviewDetailError(true); return; }
    let active = true;
    setReviewDetailLoading(true);
    getReviewDetails(requestedReviewId).then(({ data }) => {
      if (!active) return;
      if (data.author.id !== user.id) { setReviewDetailError(true); return; }
      setReviewDetail({ reviewId: data.id, movieId: data.movie.id, movieTitle: data.movie.title, moviePhotoUrl: data.movie.photoUrl, content: data.content, updatedAt: data.createdAt });
    }).catch(() => { if (active) setReviewDetailError(true); })
      .finally(() => { if (active) setReviewDetailLoading(false); });
    return () => { active = false; };
  }, [isAuth, user?.id, requestedReviewValue, requestedReviewId, reviewsAttempt]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    const request = ++reviewsRequest.current;
    const actor = reviewActor;
    const isCurrent = () => current && reviewMounted.current && currentReviewActor.current === actor && reviewsRequest.current === request;
    setReviewsLoading(true);
    setReviewsError(false);
    setReviewsHistory(null);
    getProfileReviews(reviewsPage)
      .then(({ data }) => {
        if (!isCurrent()) return;
        if (isPageOutOfRange(reviewsPage, data.totalPages)) {
          const page = getLastPageIndex(data.totalPages);
          const pending = pendingReviewFocus.current;
          if (pending && pending.target !== "error" && pending.scope === reviewScopeGeneration.current && pending.request === request) {
            const focus = { ...pending, request: request + 1 };
            pendingReviewFocus.current = focus;
            reviewPageCarry.current = { page, lang, actor, focus };
          }
          setReviewsPage(page);
          return;
        }
        setReviewsHistory(data);
      })
      .catch(() => { if (isCurrent()) setReviewsError(true); })
      .finally(() => { if (isCurrent()) setReviewsLoading(false); });
    return () => { current = false; };
  }, [isAuth, reviewsPage, reviewsAttempt, user?.id, lang]);

  useEffect(() => {
    const pending = pendingReviewFocus.current;
    if (!pending || reviewActionBusy !== null) return;
    if (pending.target !== "error" && (editingReviewId !== null || reviewsLoading || reviewDetailLoading || reviewsRequest.current !== pending.request || (!reviewsError && reviewsHistory === null))) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingReviewFocus.current !== pending) return;
      pendingReviewFocus.current = null;
      if (!reviewMounted.current || reviewScopeGeneration.current !== pending.scope) return;
      if (pending.target !== "error" && reviewsRequest.current !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (pending.target === "error") reviewErrorRef.current?.focus();
      else if (pending.target === "edit" && pending.id !== undefined) {
        const button = reviewEditButtonRefs.current.get(pending.id);
        if (button && !button.disabled) button.focus();
        else reviewHeadingRef.current?.focus();
      } else reviewHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editingReviewId, reviewActionBusy, reviewActionError, reviewsError, reviewsHistory, reviewsLoading, reviewDetailLoading, reviewsPage, profileView, settingsTab, lang, user?.id]);

  useEffect(() => {
    detailFocusPending.current = requestedReviewValue !== null || Boolean(location.state?.reviewDeleted);
  }, [requestedReviewValue, profile?.id, location.state?.reviewDeleted]);

  useEffect(() => {
    if (!detailFocusPending.current || reviewDetailLoading || reviewsLoading || !profile || editingReviewId !== null) return;
    detailFocusPending.current = false;
    const target = requestedReviewValue !== null && window.matchMedia("(max-width: 767px)").matches ? reviewDetailMobileHeadingRef.current : reviewHeadingRef.current;
    target?.focus();
  }, [requestedReviewValue, profile?.id, reviewDetailLoading, reviewsLoading, location.state?.reviewDeleted]);

  useEffect(() => {
    const origin = detailRetryOrigin.current;
    if (!origin || reviewDetailLoading || reviewsLoading) return;
    detailRetryOrigin.current = null;
    if (document.activeElement !== document.body && document.activeElement !== origin) return;
    const mobileHeading = reviewDetailMobileHeadingRef.current;
    const target = mobileHeading?.getClientRects().length ? mobileHeading : reviewHeadingRef.current;
    target?.focus();
  }, [reviewDetailLoading, reviewsLoading]);

  const renderReviewCards = (items: ProfileReview[], withScore = true, editable = false) => items.map(item => {
    const title = editorialText(item.movieTitle, t("untitledFilm"));
    const isEditing = editable && editingReviewId === item.reviewId;
    const poster = item.moviePhotoUrl === undefined
      ? profile?.recentRatings.find(rating => rating.movieId === item.movieId)?.moviePhotoUrl
      : item.moviePhotoUrl;
    return <li key={item.reviewId} className={styles.reviewCard} data-review-editing={isEditing || undefined}>
      <Link className={styles.reviewPosterLink} to={path(`/films/${item.movieId}`)} aria-label={title}>
        <ResilientImage className={styles.railPoster} src={poster} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
      </Link>
      <div className={styles.reviewCopy}>
        <div className={styles.reviewHeading}>
          <h3><Link data-profile-review-title={item.movieId} to={path(`/films/${item.movieId}`)}>{title}</Link></h3>
          <div className={styles.reviewHeadingActions}>
            {withScore && profile && <ProfileReviewScore movieId={item.movieId} ownerId={profile.id} title={title} />}
            {editable && profileView === "reviews" && !isEditing && <div className={styles.reviewActions}>
              <button ref={button => { if (button) reviewEditButtonRefs.current.set(item.reviewId, button); else reviewEditButtonRefs.current.delete(item.reviewId); }} type="button" disabled={reviewActionBusy !== null} aria-label={`${t("editReview")}: ${title}`} title={t("editReview")} onClick={() => { pendingReviewFocus.current = null; setReviewDraft(item.content); setEditingReviewId(item.reviewId); setReviewActionMessage(null); setReviewActionError(null); }}><picture><source media="(max-width: 767px)" srcSet="/images/profile-review-edit-phone.png" /><img className={styles.reviewActionIcon} src="/images/profile-review-edit.png" alt="" /></picture><span className={styles.mobileReviewActionLabel}>{t("editReview")}</span></button>
              <button type="button" disabled={reviewActionBusy !== null} aria-label={`${t("deleteReview")}: ${title}`} title={t("deleteReview")} onClick={event => requestProfileReviewDelete(item, event.currentTarget)}><picture><source media="(max-width: 767px)" srcSet="/images/profile-review-delete-phone.png" /><img className={styles.reviewActionIcon} src="/images/profile-review-delete.png" alt="" /></picture><span className={styles.mobileReviewActionLabel}>{t("deleteReview")}</span></button>
            </div>}
          </div>
        </div>
        <time dateTime={item.updatedAt}>{formatDateTime(item.updatedAt, lang)}</time>
        {isEditing ? <form className={styles.reviewEditor} onSubmit={event => { void saveProfileReview(event, item); }} aria-busy={reviewActionBusy === "save"}>
          <label className="srOnly" htmlFor={`profile-review-content-${item.reviewId}`}>{t("review")}</label>
          <textarea id={`profile-review-content-${item.reviewId}`} aria-label={t("review")} autoFocus required minLength={1} maxLength={5000} disabled={reviewActionBusy !== null} value={reviewDraft} onChange={event => setReviewDraft(event.target.value)} onKeyDown={event => { if (event.key === "Escape" && reviewActionBusy === null) { event.preventDefault(); pendingReviewFocus.current = { scope: reviewScopeGeneration.current, request: reviewsRequest.current, origin: event.currentTarget, target: "edit", id: item.reviewId }; setEditingReviewId(null); setReviewDraft(""); } }} />
          <div className={styles.reviewEditorActions}>
            <button type="button" disabled={reviewActionBusy !== null} onClick={event => { pendingReviewFocus.current = { scope: reviewScopeGeneration.current, request: reviewsRequest.current, origin: event.currentTarget, target: "edit", id: item.reviewId }; setEditingReviewId(null); setReviewDraft(""); }}>{t("cancel")}</button>
            <button type="button" className={styles.reviewDeleteButton} disabled={reviewActionBusy !== null} onClick={event => requestProfileReviewDelete(item, event.currentTarget)}>{reviewActionBusy === "delete" ? t("deleting") : t("deleteReview")}</button>
            <button type="submit" className={styles.reviewSaveButton} disabled={reviewActionBusy !== null || reviewDraft.trim().length === 0}>{reviewActionBusy === "save" ? t("saving") : t("saveReview")}</button>
          </div>
        </form> : requestedReviewValue !== null ? <p className={styles.reviewContent}>{item.content}</p> : <Link className={styles.reviewContent} to={path(`/profile?view=reviews&review=${item.reviewId}`)}>{item.content}</Link>}
        {requestedReviewValue !== null && <Link className={styles.globalReviewLink} to={path(`/reviews/${item.reviewId}`)}>{t("review")}<span aria-hidden="true"> ↗</span></Link>}
      </div>
    </li>;
  });

  const saveProfileReview = async (event: React.FormEvent<HTMLFormElement>, item: ProfileReview) => {
    event.preventDefault();
    const content = reviewDraft.trim();
    if (reviewActionBusy !== null || reviewMutation.current !== null || !content || content.length > 5000) return;
    const token = {};
    reviewMutation.current = token;
    const actor = reviewActor;
    const scope = reviewScopeGeneration.current;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const origin = submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const sameActor = () => reviewMounted.current && actor !== null && currentReviewActor.current === actor && reviewMutation.current === token;
    const sameScope = () => sameActor() && reviewScopeGeneration.current === scope;
    pendingReviewFocus.current = null;
    setReviewActionBusy("save");
    setReviewActionMessage(null);
    setReviewActionError(null);
    try {
      const { data: updated } = await updateReview(item.reviewId, { content });
      if (!sameActor()) return;
      // Preserve cached poster/timestamp fields: the PATCH DTO only supplies content/createdAt.
      setProfile(current => current?.id === actor ? { ...current, recentReviews: current.recentReviews.map(review => review.reviewId === item.reviewId ? { ...review, content: updated.content } : review) } : current);
      setReviewDetail(current => current?.reviewId === item.reviewId ? { ...current, content: updated.content } : current);
      if (sameScope()) {
        setReviewActionMessage("reviewUpdated");
        pendingReviewFocus.current = { scope, request: reviewsRequest.current + 1, origin, target: "edit", id: item.reviewId };
        setEditingReviewId(null);
        setReviewDraft("");
      }
      setReviewsLoading(true);
      setReviewsAttempt(value => value + 1);
    } catch {
      if (!sameScope()) return;
      setReviewActionError("updateReviewError");
      pendingReviewFocus.current = { scope, request: reviewsRequest.current, origin, target: "error" };
    } finally {
      if (sameActor()) { reviewMutation.current = null; setReviewActionBusy(null); }
    }
  };

  const requestProfileReviewDelete = (item: ProfileReview, trigger: HTMLButtonElement) => {
    if (reviewActionBusy !== null || reviewMutation.current !== null) return;
    setPendingReviewDelete({ item, trigger });
  };

  const confirmProfileReviewDelete = async (item: ProfileReview, origin: HTMLButtonElement) => {
    if (reviewActionBusy !== null || reviewMutation.current !== null) return;
    const token = {};
    reviewMutation.current = token;
    const actor = reviewActor;
    const scope = reviewScopeGeneration.current;
    const sameActor = () => reviewMounted.current && actor !== null && currentReviewActor.current === actor && reviewMutation.current === token;
    const sameScope = () => sameActor() && reviewScopeGeneration.current === scope;
    pendingReviewFocus.current = null;
    setReviewActionBusy("delete");
    setReviewActionMessage(null);
    setReviewActionError(null);
    try {
      await deleteReviewRequest(item.reviewId);
      if (!sameActor()) return;
      setProfile(current => current?.id === actor ? { ...current, recentReviews: current.recentReviews.filter(review => review.reviewId !== item.reviewId), stats: { ...current.stats, reviews: Math.max(0, current.stats.reviews - 1) } } : current);
      if (sameScope()) {
        setReviewActionMessage("reviewDeleted");
        pendingReviewFocus.current = { scope, request: reviewsRequest.current + 1, origin, target: "heading" };
        setEditingReviewId(null);
        setReviewDraft("");
      }
      setReviewsLoading(true);
      setReviewsAttempt(value => value + 1);
      if (sameScope() && requestedReviewValue !== null) navigate(path("/profile?view=reviews"), { replace: true, state: { reviewDeleted: true } });
    } catch {
      if (!sameScope()) return;
      setReviewActionError("deleteReviewError");
      pendingReviewFocus.current = { scope, request: reviewsRequest.current, origin, target: "error" };
    } finally {
      if (sameActor()) { reviewMutation.current = null; setReviewActionBusy(null); }
    }
  };

  return {
    reviewsLoading,
    reviewDetailLoading,
    reviewDetailMobileHeadingRef,
    renderReviewCards,
    reviewActionBusy,
    reviewHeadingRef,
    reviewActionMessage,
    reviewActionError,
    reviewErrorRef,
    reviewDetailError,
    reviewsError,
    detailRetryOrigin,
    setReviewDetailLoading,
    setReviewsAttempt,
    reviewDetail,
    reviewsHistory,
    reviewsPage,
    setReviewsPage,
    pendingReviewDelete,
    setPendingReviewDelete,
    confirmProfileReviewDelete,
  };
}

export type ProfileReviewsModel = ReturnType<typeof useProfileReviews>;
