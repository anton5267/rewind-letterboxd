import type { RefObject } from "react";
import { Link } from "react-router-dom";
import type { JournalArticle } from "../../api/journal.api";
import { formatJournalDate, localizeJournalCategory, useLocale } from "../../i18n";
import JournalCover from "./JournalCover";
import styles from "./JournalArticleHeader.module.css";

interface Props {
  article: JournalArticle;
  title: string;
  articleLanguage: "uk" | "en";
  titleRef: RefObject<HTMLHeadingElement>;
  hasAudio: boolean;
}

export default function JournalArticleHeader({ article, title, articleLanguage, titleRef, hasAudio }: Props) {
  const { lang, path, t } = useLocale();
  const authorName = article.authorName?.trim();
  return (
    <>
      <div className={styles.mobileToolbar}>
        <Link className={styles.mobileBack} to={path("/journal")} aria-label={t("journal")}>←</Link>
        <span>{t("journal")}</span>
      </div>
      <div className={styles.articleHeader}>
        <Link className={styles.back} to={path("/journal")}>
          <span className={styles.backPill}>
            {t("journal")}
            <img src={`${import.meta.env.BASE_URL}images/journal-chevron.svg`} alt="" />
          </span>
        </Link>
        <div className={styles.divider} aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}images/article-divider.svg`} alt="" />
        </div>
        <div className={styles.articleLead}>
          <p className={styles.eyebrow}>
            {localizeJournalCategory(article.category, t)}
            {article.publishedAt && (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={article.publishedAt}>{formatJournalDate(article.publishedAt, lang)}</time>
              </>
            )}
          </p>
          <h1
            className={styles.title}
            id="journal-article-title"
            ref={titleRef}
            tabIndex={-1}
            lang={article.title?.trim() ? articleLanguage : lang}
          >
            {title}
          </h1>
          {(article.publishedAt || authorName || hasAudio) && (
            <div className={styles.meta}>
              {authorName && <p className={styles.byline}>{authorName}</p>}
              {hasAudio && <span>{t("podcastAudio")}</span>}
            </div>
          )}
        </div>
        <div className={styles.coverHero}>
          <JournalCover
            className={styles.coverImage}
            coverUrl={article.coverUrl}
            images={article.coverImages}
            label={title}
            loading="eager"
            fallback={<span className={styles.coverFallback} aria-hidden="true">REWIND</span>}
          />
        </div>
      </div>
    </>
  );
}

export function JournalArticleHeaderSkeleton() {
  return (
    <>
      <div className={styles.mobileToolbar}><span className={styles.skeletonLine} /></div>
      <div className={styles.articleHeader}>
        <div className={styles.back} />
        <div className={styles.articleLead}>
          <div className={styles.skeletonLine} />
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={styles.skeletonLine} />
        </div>
        <div className={`${styles.coverHero} ${styles.skeleton}`} />
      </div>
    </>
  );
}
