import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createList, deleteList, getListItems, getUserListsPage, removeMovieFromList, reorderListItems, updateList, type UserList, type UserListItem } from "../api/lists.api";
import Pagination from "../components/Pagination";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatMovieYear, useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import styles from "./UserLists.module.css";

export default function UserLists() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
  const [lists, setLists] = useState<UserList[]>([]);
  const [listPage, setListPage] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(0);
  const [listTotalElements, setListTotalElements] = useState(0);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsLoadError, setListsLoadError] = useState(false);
  const [listsReload, setListsReload] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const editorNameRef = useRef<HTMLInputElement>(null);
  const selectedHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusEditor = useRef(false);
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
  const activeUserId = useRef<number | null>(null);
  const listMutation = useRef(0);
  const itemMutation = useRef(0);

  activeUserId.current = user?.id ?? null;

  useEffect(() => {
    listMutation.current += 1;
    itemMutation.current += 1;
    setCreateBusy(false);
    setSaveBusy(false);
    setDeleting(false);
    setItemsBusy(false);
    setSelected(null);
    setItems([]);
  }, [isAuth, user?.id]);

  useEffect(() => {
    itemMutation.current += 1;
  }, [selected]);

  useEffect(() => {
    if (!isAuth) return;
    let active = true;
    setListsLoading(true);
    setListsLoadError(false);
    setLists([]);
    selectedRef.current = null;
    setSelected(null);
    getUserListsPage(listPage)
      .then(({ data }) => {
        if (!active) return;
        if (isPageOutOfRange(listPage, data.totalPages)) {
          setListTotalPages(data.totalPages);
          setListTotalElements(data.totalElements);
          setListPage(getLastPageIndex(data.totalPages));
          return;
        }
        setLists(data.content);
        setListTotalPages(data.totalPages);
        setListTotalElements(data.totalElements);
      })
      .catch(() => { if (active) setListsLoadError(true); })
      .finally(() => { if (active) setListsLoading(false); });
    return () => { active = false; };
  }, [isAuth, listPage, listsReload, user?.id]);
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

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!focusEditor.current) return;
    const target = editorNameRef.current ?? selectedHeadingRef.current;
    if (target) {
      focusEditor.current = false;
      target.focus();
      target.scrollIntoView({ block: "center" });
    }
  }, [selected]);

  if (!ready) return <main className={styles.page} aria-labelledby="user-lists-loading-title" aria-busy={true}><h1 id="user-lists-loading-title" className="srOnly">{t("lists")}</h1><div className={styles.stateCard} role="status"><span className={styles.stateMark} aria-hidden="true">…</span><strong>{t("loading")}</strong></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || createBusy) return;
    const requestId = ++listMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && listMutation.current === requestId;
    setCreateBusy(true);
    setError("");
    try {
      await createList(name.trim(), description.trim(), isPublic, tags.split(",").map(tag => tag.trim()).filter(Boolean));
      if (!isCurrentRequest()) return;
      setListPage(0);
      setListsReload(value => value + 1);
      setName("");
      setDescription("");
      setIsPublic(false);
      setTags("");
      setError("");
      setStatus("");
    } catch { if (isCurrentRequest()) setError(t("createListError")); }
    finally { if (isCurrentRequest()) setCreateBusy(false); }
  };

  const remove = async (movieId: number) => {
    if (selected == null || itemsBusy || saveBusy || deleting) return;
    const listId = selected;
    const requestId = ++itemMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && selectedRef.current === listId && itemMutation.current === requestId;
    setItemsBusy(true);
    try {
      await removeMovieFromList(listId, movieId);
      if (isCurrentRequest()) setItems(current => current.filter(item => item.movie.id !== movieId));
    } catch { if (isCurrentRequest()) setError(t("removeItemError")); }
    finally { if (isCurrentRequest()) setItemsBusy(false); }
  };

  const selectedList = lists.find(list => list.id === selected) ?? null;
  const listControlsBusy = listsLoading || itemsBusy || createBusy || saveBusy || deleting;
  const clearSelection = () => {
    focusEditor.current = selectedRef.current !== null;
    if (!focusEditor.current) {
      editorNameRef.current?.focus();
      editorNameRef.current?.scrollIntoView({ block: "center" });
    }
    selectedRef.current = null;
    setSelected(null);
  };
  const select = (list: UserList) => {
    if (listControlsBusy) return;
    focusEditor.current = selectedRef.current !== list.id;
    if (!focusEditor.current) {
      const target = editorNameRef.current ?? selectedHeadingRef.current;
      target?.focus();
      target?.scrollIntoView({ block: "center" });
    }
    selectedRef.current = list.id;
    setSelected(list.id);
    setEditName(list.name);
    setEditDescription(list.description ?? "");
    setEditPublic(list.isPublic);
    setEditTags(list.tags.join(", "));
  };

  const saveList = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedList || selectedList.listType !== "CUSTOM" || !editName.trim() || saveBusy || itemsBusy || deleting) return;
    const requestId = ++listMutation.current;
    const requestUserId = activeUserId.current;
    const listId = selectedList.id;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && selectedRef.current === listId && listMutation.current === requestId;
    setSaveBusy(true);
    setError("");
    try {
      const { data } = await updateList(selectedList.id, editName.trim(), editDescription.trim(), editPublic, editTags.split(",").map(tag => tag.trim()).filter(Boolean));
      if (!isCurrentRequest()) return;
      setLists(current => current.map(list => list.id === data.id ? data : list));
      setEditName(data.name);
      setEditDescription(data.description ?? "");
      setEditPublic(data.isPublic);
      setEditTags(data.tags.join(", "));
      setError("");
      setStatus("");
    } catch { if (isCurrentRequest()) setError(t("updateListError")); }
    finally { if (isCurrentRequest()) setSaveBusy(false); }
  };

  const removeList = async () => {
    if (!selectedList || selectedList.listType !== "CUSTOM" || deleting || saveBusy || itemsBusy) return;
    if (!window.confirm(t("deleteListConfirm"))) return;
    const requestId = ++listMutation.current;
    const requestUserId = activeUserId.current;
    const listId = selectedList.id;
    const isCurrentMutation = () => requestUserId !== null && activeUserId.current === requestUserId && listMutation.current === requestId;
    const isCurrentRequest = () => isCurrentMutation() && selectedRef.current === listId;
    setDeleting(true);
    setError("");
    setStatus("");
    try {
      await deleteList(selectedList.id);
      if (!isCurrentRequest()) return;
      const deletingLastOnPage = lists.length === 1 && listPage > 0;
      if (deletingLastOnPage) setListPage(page => page - 1);
      else setListsReload(value => value + 1);
      clearSelection();
      setItems([]);
      setStatus(t("listDeleted"));
    } catch {
      if (isCurrentRequest()) setError(t("deleteListError"));
    } finally {
      if (isCurrentMutation()) setDeleting(false);
    }
  };

  const moveToIndex = async (itemId: number, target: number) => {
    if (selected == null || itemsBusy || saveBusy || deleting) return;
    const listId = selected;
    const index = items.findIndex(item => item.id === itemId);
    if (index < 0 || target < 0 || target >= items.length || target === index) return;
    const requestId = ++itemMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && selectedRef.current === listId && itemMutation.current === requestId;
    setItemsBusy(true);
    const reordered = [...items];
    const [moving] = reordered.splice(index, 1);
    reordered.splice(target, 0, moving);
    try {
      await reorderListItems(listId, reordered.map(item => item.id));
      if (!isCurrentRequest()) return;
      setItems(reordered);
      setError("");
    } catch { if (isCurrentRequest()) setError(t("reorderListError")); }
    finally { if (isCurrentRequest()) setItemsBusy(false); }
  };

  const move = (itemId: number, direction: -1 | 1) => {
    const index = items.findIndex(item => item.id === itemId);
    if (index >= 0) void moveToIndex(itemId, index + direction);
  };

  const handleItemDrop = (event: React.DragEvent<HTMLLIElement>, targetItemId: number) => {
    event.preventDefault();
    if (selectedList?.listType !== "CUSTOM") return;
    const sourceItemId = Number(event.dataTransfer.getData("text/plain"));
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    if (Number.isSafeInteger(sourceItemId) && targetIndex >= 0) void moveToIndex(sourceItemId, targetIndex);
  };

  return <main className={`${styles.page} ${styles.mobileEditorPage}`} aria-labelledby="user-lists-title" aria-busy={listsLoading || itemsLoading || itemsBusy || createBusy || saveBusy || deleting}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{t("listsEyebrow")}</p>
      <h1 id="user-lists-title">{selectedList?.listType === "CUSTOM" ? t("listSettings") : editorialText(selectedList?.name, t("newList"))}</h1>
      <p className={styles.heroCopy}>{t("createListIntro")}</p>
    </header>
    <div className={styles.content}>
    {error && <p className={styles.alert} role="alert">{error}</p>}
    {status && <p className={styles.status} role="status">{status}</p>}
    {!selectedList && <form className={`${styles.form} ${styles.createForm}`} aria-labelledby="user-lists-title" aria-busy={createBusy} onSubmit={create}>
      <label className={styles.nameField} htmlFor="new-list-name">{t("newList")} <input ref={editorNameRef} id="new-list-name" required disabled={createBusy} value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
      <label className={styles.descriptionField} htmlFor="new-list-description">{t("description")} <textarea id="new-list-description" rows={5} disabled={createBusy} value={description} maxLength={5000} onChange={e => setDescription(e.target.value)} /></label>
      <label className={styles.tagsField} htmlFor="new-list-tags">{t("tags")} <input id="new-list-tags" value={tags} maxLength={509} disabled={createBusy} placeholder={t("tagsHint")} onChange={e => setTags(e.target.value)} /></label>
      <label className={styles.checkboxLabel}><input type="checkbox" checked={isPublic} disabled={createBusy} onChange={e => setIsPublic(e.target.checked)} /> <span>{t("publicList")}</span></label>
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
    {selectedList && <section className={`${styles.section} ${styles.selectedSection} ${selectedList.listType === "CUSTOM" ? styles.customEditor : ""}`} aria-labelledby="selected-list-heading" aria-busy={itemsLoading || itemsBusy || saveBusy || deleting}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>{selectedList.isPublic ? t("publicList") : t("privateList")}</p>
          <h2 ref={selectedHeadingRef} id="selected-list-heading" tabIndex={-1}>{editorialText(selectedList.name, t("lists"))}</h2>
        </div>
        <button type="button" className={styles.secondaryButton} disabled={listControlsBusy} onClick={clearSelection}>{t("newList")}</button>
      </div>
      {selectedList.listType === "CUSTOM" && <form className={`${styles.form} ${styles.editForm}`} aria-labelledby="selected-list-heading" aria-busy={itemsBusy || saveBusy || deleting} onSubmit={saveList}>
        <label className={styles.nameField} htmlFor="edit-list-name">{t("listName")} <input ref={editorNameRef} id="edit-list-name" required maxLength={120} disabled={itemsBusy || saveBusy || deleting} value={editName} onChange={event => setEditName(event.target.value)} /></label>
        <label className={styles.descriptionField} htmlFor="edit-list-description">{t("description")} <textarea id="edit-list-description" rows={5} maxLength={5000} disabled={itemsBusy || saveBusy || deleting} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label>
        <label className={styles.tagsField} htmlFor="edit-list-tags">{t("tags")} <input id="edit-list-tags" value={editTags} maxLength={509} disabled={itemsBusy || saveBusy || deleting} placeholder={t("tagsHint")} onChange={event => setEditTags(event.target.value)} /></label>
        <label className={styles.checkboxLabel}><input type="checkbox" checked={editPublic} disabled={itemsBusy || saveBusy || deleting} onChange={event => setEditPublic(event.target.checked)} /> <span>{t("publicList")}</span></label>
        <div className={styles.editActions}>
          <Link className={styles.browseFilms} to={path("/films")} aria-disabled={listControlsBusy || undefined} onClick={event => { if (listControlsBusy) event.preventDefault(); }}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <span className={styles.browseDesktop}>{t("addFilm")}</span>
            <span className={styles.browseMobile}>{t("addFilm")}</span>
          </Link>
          <button type="button" className={styles.secondaryButton} disabled={itemsBusy || saveBusy || deleting} onClick={() => { clearSelection(); setError(""); }}>{t("cancelListChanges")}</button>
          <button type="button" className={styles.dangerButton} aria-busy={deleting} disabled={itemsBusy || deleting || saveBusy} onClick={() => void removeList()}>{deleting ? t("deletingList") : t("deleteList")}</button>
          {selectedList.isPublic && <Link className={styles.viewListButton} to={path(`/lists/public/${selectedList.id}`)} aria-disabled={listControlsBusy || undefined} onClick={event => { if (listControlsBusy) event.preventDefault(); }}>{t("viewList")}</Link>}
          <button type="submit" aria-busy={saveBusy} disabled={itemsBusy || saveBusy || deleting}>{saveBusy ? t("saving") : t("save")}</button>
        </div>
      </form>}
      {itemsLoading && <div className={styles.stateCard} role="status"><span className={styles.stateMark} aria-hidden="true">…</span><strong>{t("loading")}</strong></div>}
      {itemsLoadError && <div className={`${styles.stateCard} ${styles.stateError}`} role="alert"><strong>{t("loadItemsError")}</strong><RetryButton label={t("retry")} onClick={() => setItemsReload(value => value + 1)} /></div>}
      {!itemsLoading && !itemsLoadError && items.length === 0 && <div className={`${styles.emptyPreview} ${styles.selectedEmpty}`}><p className={styles.eyebrow}>{t("emptyListLabel")}</p><strong>{editorialText(selectedList.name, t("lists"))}</strong><p>{t("emptyList")}</p></div>}
      {!itemsLoading && !itemsLoadError && items.length > 0 && <>
        {selectedList.listType === "CUSTOM" && <p id="list-reorder-instructions" className="srOnly">{t("listReorderHelp")}</p>}
        <ul className={styles.items}>{items.map((item, index) => {
        const movieTitle = editorialText(item.movie.title, t("untitledFilm"));
        return <li className={styles.itemRow} key={item.id} onDragOver={event => { if (selectedList.listType === "CUSTOM") event.preventDefault(); }} onDrop={event => handleItemDrop(event, item.id)}>
          <Link className={styles.itemPosterLink} to={path(`/films/${item.movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
            <ResilientImage className={styles.itemPoster} src={item.movie.photoUrl} alt="" fallback={<span className={styles.itemPosterFallback}>{movieTitle}</span>} />
          </Link>
          <div className={styles.itemInfo}>
            <Link className={styles.itemTitle} to={path(`/films/${item.movie.id}`)}>{movieTitle}</Link>
            <span className={styles.itemMeta}><span className={styles.itemYear}>{formatMovieYear(item.movie.releaseDate, t("unknownYear"))}</span>{item.movie.rating !== null && <span className={styles.itemRating}> · ★ {item.movie.rating}</span>}</span>
          </div>
          <div className={styles.itemActions}>
            <button className={styles.itemRemoveButton} type="button" aria-busy={itemsBusy} disabled={itemsBusy || saveBusy || deleting} onClick={() => void remove(item.movie.id)}>
              <span aria-hidden="true">−</span><span className="srOnly">{t("remove")}</span>
            </button>
            {selectedList.listType === "CUSTOM" && <>
              <button className={styles.mobileMoveHandle} type="button" draggable={!itemsBusy && !saveBusy && !deleting} disabled={itemsBusy || saveBusy || deleting} aria-label={`${t("reorderItem")} ${movieTitle}`} aria-describedby="list-reorder-instructions" aria-keyshortcuts="ArrowUp ArrowDown" onKeyDown={event => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                void moveToIndex(item.id, index + (event.key === "ArrowUp" ? -1 : 1));
              }} onDragStart={event => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(item.id));
              }}>
                <span aria-hidden="true">✥</span>
              </button>
              <button className={styles.itemMoveButton} type="button" aria-busy={itemsBusy} disabled={itemsBusy || saveBusy || deleting || index === 0} onClick={() => void move(item.id, -1)} aria-label={t("moveUp")}>↑</button>
              <button className={styles.itemMoveButton} type="button" aria-busy={itemsBusy} disabled={itemsBusy || saveBusy || deleting || index === items.length - 1} onClick={() => void move(item.id, 1)} aria-label={t("moveDown")}>↓</button>
            </>}
          </div>
        </li>;
        })}</ul>
      </>}
    </section>}
    <section className={`${styles.section} ${styles.listPicker}`} aria-labelledby="my-lists-heading" aria-busy={listsLoading}>
      <h2 id="my-lists-heading">{t("lists")}</h2>
      {listsLoading && <div className={styles.stateCard} role="status"><span className={styles.stateMark} aria-hidden="true">…</span><strong>{t("loading")}</strong></div>}
      {listsLoadError && <p className={styles.alert} role="alert">{t("loadListsError")} <RetryButton label={t("retry")} onClick={() => setListsReload(value => value + 1)} /></p>}
      {!listsLoading && !listsLoadError && lists.length === 0 && <p>{t("noLists")}</p>}
      {!listsLoading && !listsLoadError && <div className={styles.listButtons}>
        {lists.map(list => <button key={list.id} type="button" disabled={listControlsBusy} onClick={() => select(list)} aria-pressed={selected === list.id}>{editorialText(list.name, t("lists"))}</button>)}
      </div>}
      {!listsLoading && !listsLoadError && <Pagination className={styles.pagination} page={listPage} totalPages={listTotalPages} label={t("listsPagination")} busy={listControlsBusy} statusSuffix={listTotalElements} onPageChange={page => { clearSelection(); setListPage(page); }} />}
    </section>
    </div>
  </main>;
}
