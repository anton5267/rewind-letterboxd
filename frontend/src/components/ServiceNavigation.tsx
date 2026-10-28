import { NavLink } from "react-router-dom";
import { useLocale } from "../i18n";
import styles from "./ServiceNavigation.module.css";

/** The service rail links only to pages supported by Rewind. */
export default function ServiceNavigation({ className = "" }: { className?: string }) {
  const { path, t } = useLocale();
  const links = [
    { href: "/hq-accounts", label: t("hqAccountsTitle") },
    { href: "/faq", label: t("serviceFaqLabel") },
    { href: "/film-data", label: t("serviceFilmDataLabel") },
    { href: "/important-data", label: t("serviceImportantDataLabel") },
    { href: "/privacy", label: t("privacyTitle") },
    { href: "/rules", label: t("rulesTitle") },
    { href: "/terms", label: t("termsTitle") },
    { href: "/conditions", label: t("conditionsTitle") },
    { href: "/safety-notice", label: t("safetyNoticeTitle") },
    { href: "/delete-account", label: t("deleteAccountTitle") },
  ];
  return <nav className={`${styles.navigation} ${className}`} aria-label={t("serviceNavigation")}>
    {links.map(link => <NavLink key={link.href} to={path(link.href)} end>{link.label}</NavLink>)}
  </nav>;
}
