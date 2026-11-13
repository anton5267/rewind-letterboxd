import type { SocialLink } from "../api/profile.api";
import { useLocale, type TranslationKey } from "../i18n";
import { safeHttpUrl } from "../utils/externalUrl";
import styles from "./ProfileSocialLinks.module.css";

const platforms: Record<string, { label: TranslationKey; icon: string }> = {
  website: { label: "socialWebsite", icon: "fa-solid fa-link" },
  instagram: { label: "socialInstagram", icon: "fa-brands fa-instagram" },
  tiktok: { label: "socialTiktok", icon: "fa-brands fa-tiktok" },
  letterboxd: { label: "socialLetterboxd", icon: "fa-solid fa-film" },
};

export default function ProfileSocialLinks({ links }: { links: readonly SocialLink[] }) {
  const { t } = useLocale();
  const visibleLinks = links.flatMap(link => {
    const url = safeHttpUrl(link.url);
    if (!url) return [];
    const platform = platforms[link.platform.trim().toLowerCase()];
    return [{ url, label: platform ? t(platform.label) : link.platform.trim() || t("socialWebsite"), icon: platform?.icon ?? "fa-solid fa-link" }];
  });
  if (visibleLinks.length === 0) return null;

  return <nav className={styles.links} aria-label={t("socialLinks")}>
    {visibleLinks.map(link => <a key={`${link.label}:${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label} title={link.label}>
      <i className={link.icon} aria-hidden="true" />
    </a>)}
  </nav>;
}
