import { NavLink } from "react-router-dom";
import { useLocale } from "../i18n";
import styles from "./ServiceNavigation.module.css";

/** The service rail links only to pages supported by Rewind. */
export default function ServiceNavigation({ className = "" }: { className?: string }) {
  const { path, t } = useLocale();
  const links = [
    { href: "/about", label: t("about") },
    { href: "/help", label: t("help") },
    { href: "/faq", label: t("faqTitle") },
    { href: "/film-data", label: t("filmData") },
    { href: "/profile?settings=profile", label: t("accountSettings") },
    { href: "/privacy", label: t("privacyTitle") },
    { href: "/rules", label: t("rulesTitle") },
    { href: "/contact", label: t("contact") },
    { href: "/delete-account", label: t("deleteAccount") },
  ];
  return <nav className={`${styles.navigation} ${className}`} aria-label={t("help")}>
    {links.map(link => <NavLink key={link.href} to={path(link.href)} end>{link.label}</NavLink>)}
  </nav>;
}
