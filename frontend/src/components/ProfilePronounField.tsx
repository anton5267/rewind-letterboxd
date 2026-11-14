import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../i18n";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import styles from "./ProfilePronounField.module.css";

const pronouns = ["They / their", "He / his", "He / their", "She / her", "She / their", "Xe / xyr", "Ze / hir", "Ze / zir", "It / its"] as const;

interface Props {
  className?: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function ProfilePronounField({ value, disabled, onChange, className }: Props) {
  const { t } = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const backButton = useRef<HTMLButtonElement>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(open, () => setOpen(false), { initialFocusRef: backButton });

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);

  return <div className={className}>
    <label id={`${id}-label`} htmlFor={`${id}-select`}>{t("profilePronoun")}</label>
    <select className={styles.desktopSelect} id={`${id}-select`} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="">{t("profilePronounNone")}</option>
      {pronouns.map(pronoun => <option key={pronoun} value={pronoun}>{pronoun}</option>)}
    </select>
    <button className={styles.mobileTrigger} type="button" disabled={disabled} aria-labelledby={`${id}-label`} aria-describedby={`${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-dialog` : undefined} onClick={() => setOpen(true)}>
      <span id={`${id}-value`}>{value || t("profilePronounNone")}</span>
      <img src="/images/profile-pronoun-back.png" width={22} height={22} alt="" />
    </button>
    {open && createPortal(<section ref={sheetRef} id={`${id}-dialog`} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <header className={styles.toolbar}>
        <button type="button" ref={backButton} onClick={() => setOpen(false)}>
          <img src="/images/profile-pronoun-back.png" width={22} height={22} alt="" />
          <span>{t("settings")}</span>
        </button>
        <h2 id={`${id}-title`}>{t("profilePronoun")}</h2>
      </header>
      <fieldset className={styles.options}>
        <legend className="srOnly">{t("profilePronoun")}</legend>
        {[...pronouns, ""].map(pronoun => <label className={styles.option} key={pronoun}>
          <input type="radio" name={`${id}-pronoun`} value={pronoun} checked={value === pronoun} tabIndex={value === pronoun ? 0 : -1} onChange={() => onChange(pronoun)} />
          <span>{pronoun || t("profilePronounNone")}</span>
          <img src="/images/profile-pronoun-check.png" width={24} height={24} alt="" />
        </label>)}
      </fieldset>
    </section>, document.body)}
  </div>;
}
