import { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import type { UserListItem } from "../api/lists.api";
import { editorialText, useLocale } from "../i18n";
import ResilientImage from "./ResilientImage";
import ListRankingField from "./ListRankingField";
import styles from "./MobileListSettings.module.css";

interface Props {
  name: string;
  description: string;
  tags: string;
  isPublic: boolean;
  isRanked: boolean;
  items: UserListItem[];
  busy: boolean;
  itemsReady: boolean;
  nameRef: RefObject<HTMLInputElement>;
  entriesRef: RefObject<HTMLButtonElement>;
  publicHref?: string;
  initialTagsFocus?: boolean;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onTags: (value: string) => void;
  onPublic: (value: boolean) => void;
  onRanked: (value: boolean) => void;
  onEntries: () => void;
  onCancel: () => void;
  onSave: (event: FormEvent) => void;
  onDelete: (trigger: HTMLButtonElement) => void;
}

export default function MobileListSettings(props: Props) {
  const { t } = useLocale();
  const id = useId();
  const tagsRef = useRef<HTMLInputElement>(null);
  const [editingTags, setEditingTags] = useState(props.initialTagsFocus ?? false);
  const tags = props.tags.split(",").map(tag => tag.trim()).filter(Boolean);

  return <form className={styles.form} aria-label={t("listSettings")} onSubmit={props.onSave} aria-busy={props.busy}>
    <div className={styles.identity}>
      <label className={styles.name} htmlFor={`${id}-name`}>
        {t("listName")}
        <input id={`${id}-name`} ref={props.nameRef} data-list-field="name" value={props.name} required aria-invalid={!props.name.trim()} maxLength={120} disabled={props.busy} onChange={event => props.onName(event.target.value)} />
      </label>
      <label className={styles.visibility}>
        <input className="srOnly" type="checkbox" data-list-field="visibility" aria-label={t("publicList")} checked={props.isPublic} disabled={props.busy} onChange={event => props.onPublic(event.target.checked)} />
        <img src="/images/list-settings-public.png" width={24} height={24} alt="" />
        <span>{t(props.isPublic ? "publicList" : "privateList")}</span>
      </label>
    </div>
    <div className={styles.description}>
      <label className="srOnly" htmlFor={`${id}-description`}>{t("description")}</label>
      <textarea id={`${id}-description`} data-list-field="description" value={props.description} maxLength={5000} disabled={props.busy} placeholder={t("description")} onChange={event => props.onDescription(event.target.value)} />
    </div>
    <div className={styles.preview}>
      <button ref={props.entriesRef} className={styles.entries} type="button" disabled={props.busy || !props.itemsReady} onClick={props.onEntries}>
        <span>{t("editListEntries")}</span><span>{props.itemsReady ? props.items.length : "…"}</span>
      </button>
      {props.itemsReady && props.items.length > 0 && <ul className={`${styles.posters} ${props.items.length > 4 ? styles.faded : ""}`}>
        {props.items.slice(0, 8).map(item => <li key={item.id}>
          <ResilientImage src={item.movie.photoUrl} alt={editorialText(item.movie.title, t("untitledFilm"))} fallback={<span>{editorialText(item.movie.title, t("untitledFilm"))}</span>} />
        </li>)}
      </ul>}
    </div>
    <div className={styles.tags}>
      <label htmlFor={`${id}-tags`}>{t("tags")}</label>
      <input ref={tagsRef} id={`${id}-tags`} data-list-field="tags" hidden={!editingTags && tags.length > 0} value={props.tags} maxLength={509} disabled={props.busy} placeholder={t("tagsHint")} onChange={event => props.onTags(event.target.value)} onBlur={() => setEditingTags(false)} />
      {!editingTags && tags.length > 0 && <div className={styles.chips}>
        {tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
        <button type="button" disabled={props.busy} aria-label={t("tags")} onClick={() => { setEditingTags(true); window.requestAnimationFrame(() => tagsRef.current?.focus()); }}>
          <img src="/images/list-settings-add-tag.png" width={20} height={20} alt="" />
        </button>
      </div>}
    </div>
    <div className={styles.ranking}>
      <ListRankingField checked={props.isRanked} disabled={props.busy} onChange={props.onRanked} />
    </div>
    <div className={styles.actions}>
      <button type="button" disabled={props.busy} onClick={props.onCancel}>{t("cancel")}</button>
      <button type="submit" disabled={props.busy || !props.name.trim()}>{props.busy ? t("saving") : t("save")}</button>
    </div>
    <div className={styles.otherActions}>
      <button type="button" disabled={props.busy} onClick={event => props.onDelete(event.currentTarget)}>{t("deleteList")}</button>
      {props.publicHref && <Link to={props.publicHref}>{t("viewList")}</Link>}
    </div>
  </form>;
}
