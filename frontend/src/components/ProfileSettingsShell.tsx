import { useEffect, useRef, type ReactNode } from "react";
import { Link, useNavigationType } from "react-router-dom";
import { useLocale } from "../i18n";
import RetryNotice from "./RetryNotice";
import styles from "./ProfileSettingsShell.module.css";

export type ProfileSettingsTab = "profile" | "authentication" | "avatar" | "connections";

interface Props {
  activeTab: ProfileSettingsTab;
  children: ReactNode;
  loading: boolean;
  loadError: boolean;
  busy: boolean;
  error: string;
  message: string;
  onRetry: () => void;
}

/** Shared composition of the four settings frames; Profile owns mutations. */
export default function ProfileSettingsShell({ activeTab, children, loading, loadError, busy, error, message, onRetry }: Props) {
  const { path, t } = useLocale();
  const navigationType = useNavigationType();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mobileTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const target = window.matchMedia("(max-width: 720px)").matches ? mobileTitleRef.current : titleRef.current;
    target?.focus({ preventScroll: true });
  }, [activeTab, navigationType]);

  const tabs = [
    { id: "profile", label: t("profile") },
    { id: "authentication", label: t("authentication") },
    { id: "avatar", label: t("avatarUrl") },
    { id: "connections", label: t("socialLinks") },
  ] as const;
  const saveFormId = `settings-form-${activeTab}`;

  return <main className={styles.page} aria-labelledby="account-settings-title" aria-busy={loading || busy}>
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
        {error && <p className={styles.error} id="profile-action-error" role="alert">{error}</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
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
