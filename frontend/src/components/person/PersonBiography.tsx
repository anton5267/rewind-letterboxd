import { useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "../../i18n";
import styles from "./PersonBiography.module.css";

interface Props {
  text?: string | null;
  language?: "uk" | "en" | null;
}

export default function PersonBiography({ text, language }: Props) {
  const { t, lang } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const paragraph = useRef<HTMLParagraphElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const restoreCollapseFocus = useRef(false);
  const biography = text?.trim() ?? "";

  useLayoutEffect(() => {
    const element = paragraph.current;
    if (!element || expanded) return;
    const measure = () =>
      setHasOverflow(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [biography, expanded]);

  useLayoutEffect(() => {
    if (expanded || !restoreCollapseFocus.current) return;
    restoreCollapseFocus.current = false;
    button.current?.focus({ preventScroll: true });
    button.current?.scrollIntoView({ block: "nearest" });
  }, [expanded]);

  if (!biography) return null;
  return (
    <div className={styles.biography}>
      <p
        id="person-biography"
        ref={paragraph}
        lang={language ?? lang}
        className={`${styles.text} ${expanded ? "" : styles.collapsed}`}
      >
        {biography}
      </p>
      {(expanded || hasOverflow) && (
        <button
          ref={button}
          className={styles.toggle}
          type="button"
          aria-expanded={expanded}
          aria-controls="person-biography"
          onClick={() => {
            restoreCollapseFocus.current = expanded;
            setExpanded((value) => !value);
          }}
        >
          {t(expanded ? "personReadLess" : "personReadMore")}
        </button>
      )}
      {language && language !== lang && (
        <p className={styles.fallback}>{t("personBiographyFallback")}</p>
      )}
    </div>
  );
}
