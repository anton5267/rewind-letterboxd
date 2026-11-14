import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type ProfileReplyPreference } from "../api/profile.api";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { useLocale } from "../i18n";
import styles from "./ReplyPreferenceField.module.css";

interface Props {
  value: ProfileReplyPreference | null;
  disabled: boolean;
  onChange: (value: ProfileReplyPreference) => void;
  onReset?: () => void;
  hint?: string;
  className?: string;
}

export default function ReplyPreferenceField({ value, disabled, onChange, onReset, hint, className }: Props) {
  const { t } = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const backButton = useRef<HTMLButtonElement>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(open, () => setOpen(false), { initialFocusRef: backButton });
  const options: { value: ProfileReplyPreference | ""; label: string }[] = [
    { value: "ANYONE", label: t("profileRepliesAnyone") },
    { value: "FOLLOWED", label: t("profileRepliesFollowed") },
    { value: "SELF", label: t("profileRepliesSelf") },
  ];
  if (onReset) options.unshift({ value: "", label: t("repliesProfileDefault") });
  const description = hint ?? t("profileRepliesHint");
  const selectPreference = (next: ProfileReplyPreference | "") => {
    if (next === "") onReset?.();
    else onChange(next);
  };
  const selectedLabel = options.find(option => option.value === (value ?? ""))?.label ?? options[0].label;

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);

  return <div className={className}>
    <label id={`${id}-label`} htmlFor={`${id}-select`}>{t("profileReplyPreference")}</label>
    <select
      className={styles.desktopSelect}
      id={`${id}-select`}
      value={value ?? ""}
      disabled={disabled}
      aria-describedby={`${id}-hint`}
      onChange={event => selectPreference(event.target.value as ProfileReplyPreference | "")}
    >
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <p className={styles.desktopHint} id={`${id}-hint`}>{description}</p>
    <button
      className={styles.mobileTrigger}
      type="button"
      disabled={disabled}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-value`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? `${id}-dialog` : undefined}
      onClick={() => setOpen(true)}
    >
      <span id={`${id}-value`}>{selectedLabel}</span>
      <img src="/images/profile-pronoun-back.png" width={22} height={22} alt="" />
    </button>
    {open && createPortal(<section
      ref={sheetRef}
      id={`${id}-dialog`}
      className={styles.sheet}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <header className={styles.toolbar}>
        <button type="button" ref={backButton} onClick={() => setOpen(false)}>
          <img src="/images/profile-pronoun-back.png" width={22} height={22} alt="" />
          <span>{t("settings")}</span>
        </button>
        <h2 id={`${id}-title`}>{t("profileReplyPreference")}</h2>
      </header>
      <fieldset className={styles.options} aria-describedby={`${id}-dialog-hint`}>
        <legend className="srOnly">{t("profileReplyPreference")}</legend>
        {options.map(option => <label className={styles.option} key={option.value}>
          <input
            type="radio"
            name={`${id}-reply-preference`}
            value={option.value}
            checked={(value ?? "") === option.value}
            tabIndex={(value ?? "") === option.value ? 0 : -1}
            onChange={() => selectPreference(option.value)}
          />
          <span>{option.label}</span>
          <img src="/images/profile-pronoun-check.png" width={24} height={24} alt="" />
        </label>)}
      </fieldset>
      <p className={styles.hint} id={`${id}-dialog-hint`}>{description}</p>
    </section>, document.body)}
  </div>;
}
