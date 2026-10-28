import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { addMovieToList, createList, deleteList, getListItems, getUserLists, getUserListsPage, removeMovieFromList, reorderListItems, updateList, type UserList, type UserListItem } from "../api/lists.api";
import { searchMovies, type MovieCard } from "../api/search.api";
import Pagination from "../components/Pagination";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatMovieYear, useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import styles from "./UserLists.module.css";

export default function UserLists() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const listParams = new URLSearchParams(location.search);
  const requestedListValue = listParams.get("list");
  const requestedListId = requestedListValue !== null && /^\d+$/.test(requestedListValue) && Number.isSafeInteger(Number(requestedListValue)) && Number(requestedListValue) > 0 ? Number(requestedListValue) : null;
  const detailMode = requestedListId !== null && listParams.get("mode") !== "edit";
  const [linkedList, setLinkedList] = useState<UserList | null>(null);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState(false);
  const [linkedRetry, setLinkedRetry] = useState(0);
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
  const editAddFilmsRef = useRef<HTMLAnchorElement>(null);
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
  const [tagsEditing, setTagsEditing] = useState(true);
  const tagsInputRef = useRef<HTMLInputElement>(null);
  const tagsToggleRef = useRef<HTMLButtonElement>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [editTags, setEditTags] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [draftFilms, setDraftFilms] = useState<MovieCard[]>([]);
  const [filmSearchOpen, setFilmSearchOpen] = useState(false);
  const [filmQuery, setFilmQuery] = useState("");
  const [filmResults, setFilmResults] = useState<MovieCard[]>([]);
  const [filmSearchLoading, setFilmSearchLoading] = useState(false);
  const [filmSearchError, setFilmSearchError] = useState(false);
  const [filmSearchRetry, setFilmSearchRetry] = useState(0);
  const filmQueryRef = useRef<HTMLInputElement>(null);
  const draftCreated = useRef<number | null>(null);
  const draftAdded = useRef(new Set<number>());
  const [draftLocked, setDraftLocked] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingListDelete, setPendingListDelete] = useState<{ id: number; trigger: HTMLButtonElement } | null>(null);
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
    setDraftFilms([]);
    setFilmSearchOpen(false);
    setFilmQuery("");
    setName("");
    setDescription("");
    setTags("");
    setIsPublic(false);
    draftCreated.current = null;
    draftAdded.current.clear();
    setDraftLocked(false);
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!filmSearchOpen || !filmQuery.trim()) {
      setFilmResults([]);
      setFilmSearchLoading(false);
      setFilmSearchError(false);
      return;
    }
    let active = true;
    setFilmSearchLoading(true);
    setFilmSearchError(false);
    const timer = window.setTimeout(() => {
      searchMovies({ q: filmQuery.trim(), sort: "newest", page: 0, size: 8 })
        .then(({ data }) => { if (active) setFilmResults(data.content); })
        .catch(() => { if (active) { setFilmResults([]); setFilmSearchError(true); } })
        .finally(() => { if (active) setFilmSearchLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filmSearchOpen, filmQuery, filmSearchRetry]);

  useEffect(() => {
    if (filmSearchOpen) filmQueryRef.current?.focus();
  }, [filmSearchOpen]);

  useEffect(() => {
    itemMutation.current += 1;
  }, [selected]);

  useEffect(() => {
    setLinkedList(null);
    setLinkedError(false);
    if (requestedListValue === null) { setLinkedLoading(false); return; }
    if (!isAuth) return;
    if (requestedListId === null) { setLinkedLoading(false); setLinkedError(true); return; }
    let active = true;
    setLinkedLoading(true);
    getUserLists().then(({ data }) => {
      if (!active) return;
      const list = data.find(item => item.id === requestedListId);
      if (!list) { setLinkedError(true); return; }
      setLinkedList(list);
      selectedRef.current = list.id;
      setSelected(list.id);
      setEditName(list.name);
      setEditDescription(list.description ?? "");
      setEditPublic(list.isPublic);
      setEditTags(list.tags.join(", "));
    }).catch(() => { if (active) setLinkedError(true); })
      .finally(() => { if (active) setLinkedLoading(false); });
    return () => { active = false; };
  }, [isAuth, user?.id, requestedListValue, requestedListId, linkedRetry]);

  useEffect(() => {
    if (!isAuth) return;
    let active = true;
    setListsLoading(true);
    setListsLoadError(false);
    setLists([]);
    if (requestedListId === null) {
      selectedRef.current = null;
      setSelected(null);
    }
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
  }, [isAuth, listPage, listsReload, user?.id, requestedListId]);
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

  useEffect(() => {
    if (requestedListId === null || linkedLoading || linkedError) return;
    const target = detailMode ? selectedHeadingRef.current : location.hash === "#add-films" ? editAddFilmsRef.current : editorNameRef.current;
    target?.focus();
  }, [requestedListId, detailMode, linkedLoading, linkedError, selected, location.hash]);

  if (!ready) return <main className={styles.page} aria-labelledby="user-lists-loading-title" aria-busy={true}><h1 id="user-lists-loading-title" className="srOnly">{t("lists")}</h1><div className={styles.stateCard} role="status"><span className={styles.stateMark} aria-hidden="true">…</span><strong>{t("loading")}</strong></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;
  if (requestedListValue !== null && (linkedLoading || linkedError || linkedList?.id !== requestedListId)) return <main className={styles.page} aria-labelledby="list-detail-title" aria-busy={linkedLoading}>
    <div className={styles.content}><h1 id="list-detail-title">{t("lists")}</h1>
      {linkedError ? <div className={styles.alert} role="alert">{t("loadListsError")} <RetryButton label={t("retry")} onClick={() => setLinkedRetry(value => value + 1)} /></div> : <p role="status">{t("loading")}</p>}
      <Link className={styles.browseFilms} to={path("/lists")}>{t("newList")}</Link>
    </div>
  </main>;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || createBusy) return;
    const requestId = ++listMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && listMutation.current === requestId;
    setCreateBusy(true);
    setError("");
    try {
      if (draftCreated.current === null) {
        const { data } = await createList(name.trim(), description.trim(), isPublic, tags.split(",").map(tag => tag.trim()).filter(Boolean));
        if (!isCurrentRequest()) return;
        draftCreated.current = data.id;
        setDraftLocked(true);
      } else {
        // Reconcile a response lost after a successful add before retrying.
        const { data } = await getListItems(draftCreated.current);
        if (!isCurrentRequest()) return;
        draftAdded.current = new Set(data.map(item => item.movie.id));
      }
      for (const film of draftFilms) {
        if (draftAdded.current.has(film.id)) continue;
        await addMovieToList(draftCreated.current, film.id);
        if (!isCurrentRequest()) return;
        draftAdded.current.add(film.id);
      }
      if (!isCurrentRequest()) return;
      const createdListId = draftCreated.current;
      setListPage(0);
      setListsReload(value => value + 1);
      setName("");
      setDescription("");
      setIsPublic(false);
      setTags("");
      setDraftFilms([]);
      setFilmSearchOpen(false);
      setFilmQuery("");
      draftCreated.current = null;
      draftAdded.current.clear();
      setDraftLocked(false);
      setError("");
      setStatus(t("listCreated"));
      navigate(path(`/lists?list=${createdListId}&mode=view`), { state: { listCreated: createdListId } });
    } catch { if (isCurrentRequest()) setError(t(draftCreated.current === null ? "createListError" : "listDraftAddError")); }
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

  const selectedList = lists.find(list => list.id === selected) ?? (linkedList?.id === selected ? linkedList : null);
  const listControlsBusy = listsLoading || itemsBusy || createBusy || saveBusy || deleting;
  const clearSelection = () => {
    setStatus("");
    if (requestedListValue !== null) navigate(path("/lists"));
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
    setStatus("");
    navigate(path(`/lists?list=${list.id}&mode=edit`));
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
      setLinkedList(current => current?.id === data.id ? data : current);
      setEditName(data.name);
      setEditDescription(data.description ?? "");
      setEditPublic(data.isPublic);
      setEditTags(data.tags.join(", "));
      setError("");
      setStatus("");
    } catch { if (isCurrentRequest()) setError(t("updateListError")); }
    finally { if (isCurrentRequest()) setSaveBusy(false); }
  };

  const requestListDelete = (trigger: HTMLButtonElement) => {
    if (!selectedList || selectedList.listType !== "CUSTOM" || deleting || saveBusy || itemsBusy) return;
    setPendingListDelete({ id: selectedList.id, trigger });
  };
  const removeList = async (listId: number) => {
    if (!selectedList || selectedList.id !== listId || selectedList.listType !== "CUSTOM" || deleting || saveBusy || itemsBusy) return;
    const requestId = ++listMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentMutation = () => requestUserId !== null && activeUserId.current === requestUserId && listMutation.current === requestId;
    const isCurrentRequest = () => isCurrentMutation() && selectedRef.current === listId;
    setDeleting(true);
    setError("");
    setStatus("");
    try {
      await deleteList(listId);
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
    if (detailMode || selectedList?.listType !== "CUSTOM") return;
    const sourceItemId = Number(event.dataTransfer.getData("text/plain"));
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    if (Number.isSafeInteger(sourceItemId) && targetIndex >= 0) void moveToIndex(sourceItemId, targetIndex);
  };

  return <main className={`${styles.page} ${styles.mobileEditorPage} ${!selectedList ? styles.createPage : ""}`} data-list-editor={!selectedList ? "create" : "edit"} aria-labelledby="user-lists-title" aria-busy={listsLoading || itemsLoading || itemsBusy || createBusy || saveBusy || deleting}>
    {!selectedList && <div className={styles.createMobileHeader}>
      <Link to={path("/profile?view=lists")} aria-label={t("backToProfile")}><img src="/images/list-create-back.svg" alt="" width="18" height="18" /></Link>
      <span>{t("createListTitle")}</span>
      <span aria-hidden="true" />
    </div>}
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{t("listsEyebrow")}</p>
      <h1 id="user-lists-title">{!detailMode && selectedList?.listType === "CUSTOM" ? t("listSettings") : editorialText(selectedList?.name, t("newList"))}</h1>
      <p className={styles.heroCopy}>{t("createListIntro")}</p>
    </header>
    <div className={styles.content}>
    {error && <p className={styles.alert} role="alert">{error}</p>}
    {(status || (detailMode && location.state?.listCreated === selectedList?.id)) && <p className={styles.status} role="status">{status || t("listCreated")}</p>}
    {!selectedList && <form className={`${styles.form} ${styles.createForm}`} aria-labelledby="user-lists-title" aria-busy={createBusy} onSubmit={create}>
      <label className={styles.nameField} htmlFor="new-list-name">{t("listName")} <input ref={editorNameRef} id="new-list-name" required disabled={createBusy || draftLocked} value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
      <label className={styles.descriptionField} htmlFor="new-list-description">{t("description")} <textarea id="new-list-description" rows={5} disabled={createBusy || draftLocked} value={description} maxLength={5000} onChange={e => setDescription(e.target.value)} /></label>
      <div className={styles.createTags}>
        <label className={styles.tagsField} htmlFor="new-list-tags">{t("tags")} <input ref={tagsInputRef} id="new-list-tags" className={!tagsEditing && tags.trim() ? styles.tagsInputCollapsed : ""} value={tags} maxLength={509} disabled={createBusy || draftLocked} placeholder={t("tagsHint")} onChange={e => setTags(e.target.value)} onBlur={() => setTagsEditing(false)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); setTagsEditing(false); if (tags.trim()) window.requestAnimationFrame(() => tagsToggleRef.current?.focus()); } }} /></label>
        {tags.trim() && <div className={styles.draftTags}>{tags.split(",").map(tag => tag.trim()).filter(Boolean).map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}<button ref={tagsToggleRef} type="button" disabled={createBusy || draftLocked} aria-label={t("tags")} onClick={() => { setTagsEditing(true); window.requestAnimationFrame(() => tagsInputRef.current?.focus()); }}><img src="/images/list-create-tag-add.svg" alt="" width="16" height="16" /></button></div>}
      </div>
      <fieldset className={styles.createSettings}>
        <legend>{t("settings")}</legend>
        <label className={styles.checkboxLabel}><input type="checkbox" checked={isPublic} disabled={createBusy || draftLocked} onChange={e => setIsPublic(e.target.checked)} /><span className={styles.settingIcon}><img src="/images/list-create-public.svg" alt="" width="18" height="18" /></span> <span>{t("publicList")}</span></label>
        <p className={styles.rankingUnavailable}><span className={styles.settingIcon}><img src="/images/list-create-ranked.svg" alt="" width="18" height="18" /></span><span>{t("listRankingUnavailable")}</span></p>
      </fieldset>
      <section className={styles.draftFilms} aria-labelledby="draft-films-title">
        <div className={styles.draftFilmsHeading}><h2 id="draft-films-title">{t("films")}</h2><span>{draftFilms.length} {t("listEntries")}</span></div>
        <button className={styles.draftAddFilms} type="button" disabled={createBusy || draftLocked} aria-expanded={filmSearchOpen} aria-controls="draft-film-search" onClick={() => setFilmSearchOpen(open => !open)}><img src="/images/list-create-film-add.svg" alt="" width="18" height="18" />{t("addFilm")}</button>
        {filmSearchOpen && <div id="draft-film-search" className={styles.draftFilmSearch}>
          <label htmlFor="draft-film-query">{t("searchFilms")}</label>
          <input ref={filmQueryRef} id="draft-film-query" type="search" value={filmQuery} disabled={createBusy || draftLocked} onChange={event => setFilmQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); if (event.key === "Escape") { event.preventDefault(); setFilmSearchOpen(false); document.querySelector<HTMLButtonElement>(`[aria-controls="draft-film-search"]`)?.focus(); } }} />
          {filmSearchLoading && <p role="status">{t("loading")}</p>}
          {filmSearchError && <p role="alert">{t("loadFilmsError")} <RetryButton label={t("retry")} onClick={() => setFilmSearchRetry(value => value + 1)} /></p>}
          {!filmSearchLoading && !filmSearchError && filmQuery.trim() && filmResults.length === 0 && <p>{t("noFilms")}</p>}
          {!filmSearchLoading && !filmSearchError && <ul className={styles.draftResults}>{filmResults.map(film => <li key={film.id}><button type="button" disabled={createBusy || draftLocked || draftFilms.some(item => item.id === film.id)} onClick={() => setDraftFilms(current => current.some(item => item.id === film.id) ? current : [...current, film])}>{editorialText(film.title, t("untitledFilm"))} · {formatMovieYear(film.releaseDate, t("unknownYear"))}</button></li>)}</ul>}
        </div>}
        {draftFilms.length === 0 ? <div className={styles.draftEmpty}><strong>{t("listNoFilmsTitle")}</strong><p>{t("listNoFilmsHint")}</p></div> : <ul className={styles.draftSelection}>{draftFilms.map(film => <li key={film.id}><span>{editorialText(film.title, t("untitledFilm"))}</span><button type="button" disabled={createBusy || draftLocked} aria-label={`${t("remove")} ${editorialText(film.title, t("untitledFilm"))}`} onClick={() => setDraftFilms(current => current.filter(item => item.id !== film.id))}>−</button></li>)}</ul>}
      </section>
      <div className={styles.createActions}>
        <Link className={styles.createCancel} to={path("/profile?view=lists")} aria-disabled={createBusy || undefined} onClick={event => { if (createBusy) event.preventDefault(); }}>{t("cancel")}</Link>
        <button type="submit" aria-busy={createBusy} disabled={createBusy}>{createBusy ? t("saving") : t("save")}</button>
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
      {detailMode && <div className={styles.ownerDetail}>
        {selectedList.description && <p>{selectedList.description}</p>}
        <p>{selectedList.isPublic ? t("publicList") : t("privateList")}</p>
        {selectedList.tags.length > 0 && <div className={styles.draftTags}>{selectedList.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
        <div className={styles.editActions}>
          <Link className={styles.viewListButton} to={path(`/lists?list=${selectedList.id}&mode=edit`)}>{t("listSettings")}</Link>
          <Link className={styles.viewListButton} to={path(`/lists?list=${selectedList.id}&mode=edit#add-films`)}>{t("addFilm")}</Link>
          {selectedList.isPublic && <Link className={styles.viewListButton} to={path(`/lists/public/${selectedList.id}`)}>{t("viewList")}</Link>}
        </div>
      </div>}
      {!detailMode && selectedList.listType === "CUSTOM" && <form className={`${styles.form} ${styles.editForm}`} aria-labelledby="selected-list-heading" aria-busy={itemsBusy || saveBusy || deleting} onSubmit={saveList}>
        <label className={styles.nameField} htmlFor="edit-list-name">{t("listName")} <input ref={editorNameRef} id="edit-list-name" required maxLength={120} disabled={itemsBusy || saveBusy || deleting} value={editName} onChange={event => setEditName(event.target.value)} /></label>
        <label className={styles.descriptionField} htmlFor="edit-list-description">{t("description")} <textarea id="edit-list-description" rows={5} maxLength={5000} disabled={itemsBusy || saveBusy || deleting} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label>
        <label className={styles.tagsField} htmlFor="edit-list-tags">{t("tags")} <input id="edit-list-tags" value={editTags} maxLength={509} disabled={itemsBusy || saveBusy || deleting} placeholder={t("tagsHint")} onChange={event => setEditTags(event.target.value)} /></label>
        <label className={styles.checkboxLabel}><input type="checkbox" checked={editPublic} disabled={itemsBusy || saveBusy || deleting} onChange={event => setEditPublic(event.target.checked)} /> <span>{t("publicList")}</span></label>
        <div className={styles.editActions}>
          <Link ref={editAddFilmsRef} className={styles.browseFilms} to={path("/films")} aria-disabled={listControlsBusy || undefined} onClick={event => { if (listControlsBusy) event.preventDefault(); }}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <span className={styles.browseDesktop}>{t("addFilm")}</span>
            <span className={styles.browseMobile}>{t("addFilm")}</span>
          </Link>
          <button type="button" className={styles.secondaryButton} disabled={itemsBusy || saveBusy || deleting} onClick={() => { clearSelection(); setError(""); }}>{t("cancelListChanges")}</button>
          <button type="button" className={styles.dangerButton} aria-busy={deleting} disabled={itemsBusy || deleting || saveBusy} onClick={event => requestListDelete(event.currentTarget)}>{deleting ? t("deletingList") : t("deleteList")}</button>
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
          {!detailMode && <div className={styles.itemActions}>
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
          </div>}
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
    <ConfirmDialog open={pendingListDelete !== null} title={t("deleteList")} description={t("deleteListConfirm")} cancelLabel={t("cancel")} confirmLabel={t("deleteList")} trigger={pendingListDelete?.trigger ?? null} onCancel={() => setPendingListDelete(null)} onConfirm={() => { const id = pendingListDelete?.id; setPendingListDelete(null); if (id !== undefined) void removeList(id); }} />
  </main>;
}
