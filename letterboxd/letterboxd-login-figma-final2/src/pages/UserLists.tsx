import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createList, deleteList, getListItems, getUserListsPage, removeMovieFromList, reorderListItems, updateList, type UserList, type UserListItem } from "../api/lists.api";
import ResilientImage from "../components/ResilientImage";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import styles from "./UserLists.module.css";

export default function UserLists() {
  const { isAuth, ready } = useAuth();
  const { path, t } = useLocale();
  const [lists, setLists] = useState<UserList[]>([]);
  const [listPage, setListPage] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(0);
  const [listTotalElements, setListTotalElements] = useState(0);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsLoadError, setListsLoadError] = useState(false);
  const [listsReload, setListsReload] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [items, setItems] = useState<UserListItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsLoadError, setItemsLoadError] = useState(false);
  const [itemsReload, setItemsReload] = useState(0);
  const [itemsBusy, setItemsBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [editTags, setEditTags] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    let active = true;
    setListsLoading(true);
    setListsLoadError(false);
    setLists([]);
    setSelected(null);
    getUserListsPage(listPage)
      .then(({ data }) => { if (active) { setLists(data.content); setListTotalPages(data.totalPages); setListTotalElements(data.totalElements); } })
      .catch(() => { if (active) setListsLoadError(true); })
      .finally(() => { if (active) setListsLoading(false); });
    return () => { active = false; };
  }, [isAuth, listPage, listsReload]);
  useEffect(() => {
    setItemsLoading(true);
    setItemsLoadError(false);
    setError("");
    if (selected == null) {
      setItems([]);
      setItemsLoading(false);
      return;
    }
    let active = true;
    setItems([]);
    getListItems(selected)
      .then(({ data }) => { if (active) setItems(data); })
      .catch(() => { if (active) setItemsLoadError(true); })
      .finally(() => { if (active) setItemsLoading(false); });
    return () => { active = false; };
  }, [selected, itemsReload]);

  if (!ready) return <main>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || createBusy) return;
    setCreateBusy(true);
    setError("");
    try {
      await createList(name.trim(), description.trim(), isPublic, tags.split(",").map(tag => tag.trim()).filter(Boolean));
      setListPage(0);
      setListsReload(value => value + 1);
      setName("");
      setDescription("");
      setIsPublic(false);
      setTags("");
      setError("");
      setStatus("");
    } catch { setError(t("createListError")); }
    finally { setCreateBusy(false); }
  };

  const remove = async (movieId: number) => {
    if (selected == null || itemsBusy) return;
    setItemsBusy(true);
    try {
      await removeMovieFromList(selected, movieId);
      setItems(current => current.filter(item => item.movie.id !== movieId));
    } catch { setError(t("removeItemError")); }
    finally { setItemsBusy(false); }
  };

  const selectedList = lists.find(list => list.id === selected) ?? null;
  const select = (list: UserList) => {
    setSelected(list.id);
    setEditName(list.name);
    setEditDescription(list.description ?? "");
    setEditPublic(list.isPublic);
    setEditTags(list.tags.join(", "));
  };

  const saveList = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedList || selectedList.listType !== "CUSTOM" || !editName.trim() || saveBusy) return;
    setSaveBusy(true);
    setError("");
    try {
      const { data } = await updateList(selectedList.id, editName.trim(), editDescription.trim(), editPublic, editTags.split(",").map(tag => tag.trim()).filter(Boolean));
      setLists(current => current.map(list => list.id === data.id ? data : list));
      setError("");
      setStatus("");
    } catch { setError(t("updateListError")); }
    finally { setSaveBusy(false); }
  };

  const removeList = async () => {
    if (!selectedList || selectedList.listType !== "CUSTOM" || deleting) return;
    if (!window.confirm(t("deleteListConfirm"))) return;
    setDeleting(true);
    setError("");
    setStatus("");
    try {
      await deleteList(selectedList.id);
      const deletingLastOnPage = lists.length === 1 && listPage > 0;
      if (deletingLastOnPage) setListPage(page => page - 1);
      else setListsReload(value => value + 1);
      setSelected(null);
      setItems([]);
      setStatus(t("listDeleted"));
    } catch {
      setError(t("deleteListError"));
    } finally {
      setDeleting(false);
    }
  };

  const move = async (itemId: number, direction: -1 | 1) => {
    if (selected == null || itemsBusy) return;
    const index = items.findIndex(item => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    setItemsBusy(true);
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      await reorderListItems(selected, reordered.map(item => item.id));
      setItems(reordered);
      setError("");
    } catch { setError(t("reorderListError")); }
    finally { setItemsBusy(false); }
  };

  return <main className={styles.page} aria-busy={listsLoading || itemsLoading || itemsBusy || createBusy || saveBusy || deleting}>
    <div className={styles.content}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{t("listsEyebrow")}</p>
      <h1>{selectedList?.name ?? t("newList")}</h1>
      <p className={styles.heroCopy}>{selectedList?.description?.trim() || t("createListIntro")}</p>
    </header>
    {error && <p className={styles.alert} role="alert">{error}</p>}
    {status && <p className={styles.status} role="status">{status}</p>}
    {!selectedList && <form className={`${styles.form} ${styles.createForm}`} aria-busy={createBusy} onSubmit={create}>
      <label htmlFor="new-list-name">{t("newList")} <input id="new-list-name" required value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
      <label htmlFor="new-list-description">{t("description")} <textarea id="new-list-description" rows={5} value={description} maxLength={5000} onChange={e => setDescription(e.target.value)} /></label>
      <label htmlFor="new-list-tags">{t("tags")} <input id="new-list-tags" value={tags} maxLength={509} placeholder={t("tagsHint")} onChange={e => setTags(e.target.value)} /></label>
      <label><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> {t("publicList")}</label>
      <div className={styles.createActions}>
        <button type="submit" aria-busy={createBusy} disabled={createBusy}>{createBusy ? t("saving") : t("create")}</button>
        <span>{isPublic ? t("publicList") : t("privateList")}</span>
      </div>
    </form>}
    {!selectedList && <aside className={styles.emptyPreview} aria-label={t("emptyList")}>
      <p className={styles.eyebrow}>{t("previewLabel")}</p>
      <strong>{name.trim() || t("newList")}</strong>
      <p>{description.trim() || t("emptyList")}</p>
      {tags.trim() && <div className={styles.previewTags}>{tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => <span key={tag}>#{tag}</span>)}</div>}
    </aside>}
    <section className={styles.section} aria-labelledby="my-lists-heading" aria-busy={listsLoading}>
      <h2 id="my-lists-heading">{t("lists")}</h2>
      {listsLoading && <p aria-live="polite">{t("loading")}</p>}
      {listsLoadError && <p className={styles.alert} role="alert">{t("loadListsError")} <button type="button" onClick={() => setListsReload(value => value + 1)}>{t("retry")}</button></p>}
      {!listsLoading && !listsLoadError && lists.length === 0 && <p>{t("noLists")}</p>}
      {!listsLoading && !listsLoadError && <div className={styles.listButtons}>
        {lists.map(list => <button key={list.id} type="button" onClick={() => select(list)} aria-pressed={selected === list.id}>{list.name}</button>)}
      </div>}
      {!listsLoading && !listsLoadError && listTotalPages > 1 && <nav className={styles.pagination} aria-label={t("listsPagination")}>
        <button type="button" disabled={listPage === 0} onClick={() => { setSelected(null); setListPage(page => page - 1); }}>{t("previous")}</button>
        <span>{t("page")} {listPage + 1} {t("of")} {listTotalPages} · {listTotalElements}</span>
        <button type="button" disabled={listPage + 1 >= listTotalPages} onClick={() => { setSelected(null); setListPage(page => page + 1); }}>{t("next")}</button>
      </nav>}
    </section>
    {selectedList && <section className={`${styles.section} ${styles.selectedSection}`} aria-labelledby="selected-list-heading" aria-busy={itemsLoading || itemsBusy || saveBusy || deleting}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>{selectedList.isPublic ? t("publicList") : t("privateList")}</p>
          <h2 id="selected-list-heading">{selectedList.name}</h2>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={() => setSelected(null)}>{t("newList")}</button>
      </div>
      {selectedList.listType === "CUSTOM" && <form className={`${styles.form} ${styles.editForm}`} aria-busy={saveBusy || deleting} onSubmit={saveList}>
        <label htmlFor="edit-list-name">{t("listName")} <input id="edit-list-name" required maxLength={120} value={editName} onChange={event => setEditName(event.target.value)} /></label>
        <label htmlFor="edit-list-description">{t("description")} <textarea id="edit-list-description" rows={5} maxLength={5000} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label>
        <label htmlFor="edit-list-tags">{t("tags")} <input id="edit-list-tags" value={editTags} maxLength={509} placeholder={t("tagsHint")} onChange={event => setEditTags(event.target.value)} /></label>
        <label><input type="checkbox" checked={editPublic} onChange={event => setEditPublic(event.target.checked)} /> {t("publicList")}</label>{" "}
        <button type="submit" aria-busy={saveBusy} disabled={saveBusy}>{saveBusy ? t("saving") : t("save")}</button>
        <button type="button" className={styles.secondaryButton} disabled={saveBusy || deleting} onClick={() => { setSelected(null); setError(""); }}>{t("cancel")}</button>
        {" "}<button type="button" className={styles.dangerButton} aria-busy={deleting} disabled={deleting || saveBusy} onClick={() => void removeList()}>{deleting ? t("deletingList") : t("deleteList")}</button>
      </form>}
      {itemsLoading && <div className={styles.stateCard} role="status"><span className={styles.stateMark}>…</span><strong>{t("loading")}</strong></div>}
      {itemsLoadError && <div className={`${styles.stateCard} ${styles.stateError}`} role="alert"><strong>{t("loadItemsError")}</strong><button type="button" onClick={() => setItemsReload(value => value + 1)}>{t("retry")}</button></div>}
      {!itemsLoading && !itemsLoadError && items.length === 0 && <div className={`${styles.emptyPreview} ${styles.selectedEmpty}`}><p className={styles.eyebrow}>{t("emptyListLabel")}</p><strong>{selectedList.name}</strong><p>{t("emptyList")}</p></div>}
      {!itemsLoading && !itemsLoadError && items.length > 0 && <ul className={styles.items}>{items.map((item, index) => <li className={styles.itemRow} key={item.id}>
        <Link className={styles.itemPosterLink} to={path(`/films/${item.movie.id}`)} aria-label={`${item.movie.title} ${t("poster")}`}>
          <ResilientImage className={styles.itemPoster} src={item.movie.photoUrl} alt="" fallback={<span className={styles.itemPosterFallback}>{item.movie.title}</span>} />
        </Link>
        <div className={styles.itemInfo}>
          <Link className={styles.itemTitle} to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>
          <span className={styles.itemMeta}>{item.movie.releaseDate?.slice(0, 4) ?? "—"}{item.movie.rating !== null && <> · ★ {item.movie.rating}</>}</span>
        </div>
        <div className={styles.itemActions}>
          <button type="button" aria-busy={itemsBusy} disabled={itemsBusy} onClick={() => void remove(item.movie.id)}>{t("remove")}</button>
          {selectedList.listType === "CUSTOM" && <><button type="button" aria-busy={itemsBusy} disabled={itemsBusy || index === 0} onClick={() => void move(item.id, -1)} aria-label={t("moveUp")}>↑</button><button type="button" aria-busy={itemsBusy} disabled={itemsBusy || index === items.length - 1} onClick={() => void move(item.id, 1)} aria-label={t("moveDown")}>↓</button></>}
        </div>
      </li>)}</ul>}
    </section>}
    </div>
  </main>;
}
