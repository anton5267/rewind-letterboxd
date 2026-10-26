import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigationType } from "react-router-dom";
import { useLocale } from "../i18n";
import RetryNotice from "./RetryNotice";
import styles from "./ProfileSettingsShell.module.css";

const settingsAnchorIds = new Set(["profile-avatar-url", "profile-identity-form-title", "social-links-settings", "profile-password-form-title"]);

export type ProfileSettingsTab = "profile" | "authentication" | "avatar" | "connections";

export interface ProfileSettingsFeedback {
  id: number;
  origin: HTMLElement | null;
  kind: "success" | "error";
}

interface Props {
  activeTab: ProfileSettingsTab;
  children: ReactNode;
  loading: boolean;
  loadError: boolean;
  busy: boolean;
  error: string;
  message: string;
  feedback?: ProfileSettingsFeedback | null;
  onRetry: () => void;
}

/** Shared composition of the four settings frames; Profile owns mutations. */
export default function ProfileSettingsShell({ activeTab, children, loading, loadError, busy, error, message, feedback, onRetry }: Props) {
  const { path, t, lang } = useLocale();
  const navigationType = useNavigationType();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const pendingAnchor = useRef<{ key: string; id: string; origin: HTMLElement | null; placeholder: HTMLElement | null } | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mobileTitleRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const feedbackScope = useRef(0);
  const handledFeedback = useRef<number | null>(null);
  const latestFeedback = useRef(feedback);
  latestFeedback.current = feedback;

  useLayoutEffect(() => {
    feedbackScope.current += 1;
    return () => { feedbackScope.current += 1; };
  }, [activeTab, lang]);

  useEffect(() => {
    if (!feedback || busy || loading || loadError || handledFeedback.current === feedback.id) return;
    if (feedback.kind === "error" ? !error : !message) return;
    const scope = feedbackScope.current;
    const frame = window.requestAnimationFrame(() => {
      if (latestFeedback.current !== feedback || feedbackScope.current !== scope || handledFeedback.current === feedback.id) return;
      handledFeedback.current = feedback.id;
      if (document.activeElement !== document.body && document.activeElement !== feedback.origin) return;
      (feedback.kind === "error" ? errorRef.current : messageRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [feedback, busy, loading, loadError, error, message, activeTab, lang]);


  useLayoutEffect(() => {
    pendingAnchor.current = null;
    if (navigationType !== "POP") {
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { id = ""; }
      if (settingsAnchorIds.has(id)) pendingAnchor.current = {
        key: location.key,
        id,
        origin: document.activeElement instanceof HTMLElement ? document.activeElement : null,
        placeholder: window.matchMedia("(max-width: 720px)").matches ? mobileTitleRef.current : titleRef.current,
      };
    }
    return () => { pendingAnchor.current = null; };
  }, [activeTab, lang, location.key, location.hash, navigationType]);

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const target = window.matchMedia("(max-width: 720px)").matches ? mobileTitleRef.current : titleRef.current;
    if (pendingAnchor.current?.key === location.key) pendingAnchor.current.placeholder = target;
    target?.focus({ preventScroll: true });
  }, [activeTab, navigationType]);

  useEffect(() => {
    const pending = pendingAnchor.current;
    if (!pending || pending.key !== location.key || loading || loadError || busy) return;
    const target = document.getElementById(pending.id);
    if (!target || !mainRef.current?.contains(target) || target.getClientRects().length === 0 || getComputedStyle(target).visibility !== "visible") {
      pendingAnchor.current = null;
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      if (pendingAnchor.current !== pending) return;
      pendingAnchor.current = null;
      if (!target.isConnected || !mainRef.current?.contains(target) || target.getClientRects().length === 0) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin && active !== pending.placeholder) return;
      if (!target.hasAttribute("tabindex") && !target.matches("input, button, a, select, textarea")) target.tabIndex = -1;
      target.scrollIntoView({ block: "center", behavior: "instant" });
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, lang, location.key, location.hash, loading, loadError, busy]);

  const tabs = [
    { id: "profile", label: t("profile") },
    { id: "authentication", label: t("authentication") },
    { id: "avatar", label: t("avatarUrl") },
    { id: "connections", label: t("socialLinks") },
  ] as const;
  const saveFormId = `settings-form-${activeTab}`;

  return <main ref={mainRef} className={styles.page} aria-labelledby="account-settings-title" aria-busy={loading || busy}>
    <header className={styles.hero}>
      <h1 ref={titleRef} id="account-settings-title" tabIndex={-1}>{t("accountSettings")}</h1>
      <p>{t("accountSettingsIntro")}</p>
      <div className={styles.mobileToolbar}>
        <Link to={path("/profile")} aria-label={t("cancel")}>{t("cancel")}</Link>
        <h2 ref={mobileTitleRef} tabIndex={-1}>{t("settings")}</h2>
        <button type="submit" form={saveFormId} disabled={busy || loading || loadError}>{t("save")}</button>
      </div>
    </header>
    <div className={styles.content}>
      <nav className={styles.navigation} aria-label={t("accountSettings")}>
        {tabs.map(tab => <Link key={tab.id} to={`${path("/profile")}?settings=${tab.id}`} aria-current={activeTab === tab.id ? "page" : undefined}>{tab.label}</Link>)}
      </nav>
      <Link className={styles.back} to={path("/profile")} aria-label={t("backToProfile")}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        <span>{t("backToProfile")}</span>
      </Link>
      <section className={styles.settingsSection} aria-label={tabs.find(tab => tab.id === activeTab)?.label}>
        {error && <p ref={errorRef} tabIndex={-1} className={styles.error} id="profile-action-error" role="alert">{error}</p>}
        {message && <p ref={messageRef} tabIndex={-1} className={styles.message} role="status">{message}</p>}
        {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {loadError && <RetryNotice className={styles.error} message={t("loadProfileError")} retryLabel={t("retry")} onRetry={onRetry} />}
        {!loading && !loadError && children}
      </section>
      <nav className={styles.accountLinks} aria-label={t("profileActions")}>
        {tabs.filter(tab => tab.id !== activeTab).map(tab => <Link className={styles.mobileSettingLink} key={tab.id} to={`${path("/profile")}?settings=${tab.id}`}>{tab.label} <span aria-hidden="true">→</span></Link>)}
        <Link to={`${path("/profile")}#newsletter-settings`}>{t("newsletter")}</Link>
        <Link to={`${path("/profile")}#profile-delete-form-title`}>{t("deleteAccount")}</Link>
      </nav>
    </div>
  </main>;
}
