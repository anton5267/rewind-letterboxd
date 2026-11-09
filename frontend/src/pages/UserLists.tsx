import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { createList, deleteList, getListItems, getUserLists, getUserListsPage, removeMovieFromList, reorderListItems, updateList, type UserList, type UserListItem } from "../api/lists.api";
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
  const { path, t, lang } = useLocale();
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
  const [selectedListSnapshot, setSelectedListSnapshot] = useState<UserList | null>(null);
  const selectedRef = useRef<number | null>(null);
  const editorNameRef = useRef<HTMLInputElement>(null);
  const editAddFilmsRef = useRef<HTMLAnchorElement>(null);
  const selectedHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusEditor = useRef(false);
  const [items, setItems] = useState<UserListItem[]>([]);
  const pendingReorderFocus = useRef<{ itemId: number; origin: HTMLElement | null } | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsLoadError, setItemsLoadError] = useState(false);
  const [itemsReload, setItemsReload] = useState(0);
  const [itemsBusy, setItemsBusy] = useState(false);
  useLayoutEffect(() => {
    const pending = pendingReorderFocus.current;
    if (!pending || itemsBusy) return;
    const active = document.activeElement;
    if (active !== document.body && active !== pending.origin) {
      pendingReorderFocus.current = null;
      return;
    }
    const controls = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-list-reorder-item]"));
    const control = controls.find(button => button.dataset.listReorderItem === String(pending.itemId) && button.getClientRects().length > 0 && !button.disabled);
    if (!control) return;
    pendingReorderFocus.current = null;
    control.focus();
  }, [items, itemsBusy]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [tagsEditing, setTagsEditing] = useState(true);
  const tagsCollapseTimer = useRef<number | null>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);
  const tagsToggleRef = useRef<HTMLButtonElement>(null);
  const listDetailHeadingRef = useRef<HTMLHeadingElement>(null);
  const listsHeadingRef = useRef<HTMLHeadingElement>(null);
  const retryFocus = useRef<{ kind: "linked" | "films" | "items" | "lists"; route: string; lang: string; userId: number | null; query: string; selected: number | null; origin: HTMLElement | null } | null>(null);

  useEffect(() => () => {
    if (tagsCollapseTimer.current !== null) window.clearTimeout(tagsCollapseTimer.current);
  }, []);
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
    setSelectedListSnapshot(null);
    setItems([]);
    setDraftFilms([]);
    setFilmSearchOpen(false);
    setFilmQuery("");
    setName("");
    setDescription("");
    setTags("");
    setIsPublic(false);
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
    const pending = retryFocus.current;
    if (!pending) return;
    if (pending.route !== `${location.pathname}${location.search}` || pending.lang !== lang || pending.userId !== (user?.id ?? null)) {
      retryFocus.current = null;
      return;
    }
    const busy = pending.kind === "linked" ? linkedLoading
      : pending.kind === "films" ? filmSearchLoading
        : pending.kind === "items" ? itemsLoading : listsLoading;
    if (busy) return;
    const failed = pending.kind === "linked" ? linkedError
      : pending.kind === "films" ? filmSearchError
        : pending.kind === "items" ? itemsLoadError : listsLoadError;
    if (pending.kind === "films" && pending.query !== filmQuery) {
      retryFocus.current = null;
      return;
    }
    if (pending.kind === "items" && pending.selected !== selected) {
      retryFocus.current = null;
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      const scope = pending.kind === "linked"
        ? document.querySelector<HTMLElement>('main[aria-labelledby="list-detail-title"]')
        : pending.kind === "films"
          ? document.getElementById("draft-film-search")
          : pending.kind === "items"
            ? document.querySelector<HTMLElement>('[aria-labelledby="selected-list-heading"]')
            : document.querySelector<HTMLElement>('[aria-labelledby="my-lists-heading"]');
      if (failed) scope?.querySelector<HTMLElement>("[data-retry-button]")?.focus();
      else if (pending.kind === "linked") listDetailHeadingRef.current?.focus();
      else if (pending.kind === "films") filmQueryRef.current?.focus();
      else if (pending.kind === "items") selectedHeadingRef.current?.focus();
      else listsHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search, lang, user?.id, linkedLoading, linkedError, filmSearchLoading, filmSearchError, filmQuery, itemsLoading, itemsLoadError, selected, listsLoading, listsLoadError]);

  const rememberRetry = (kind: NonNullable<typeof retryFocus.current>["kind"], origin: HTMLElement) => {
    retryFocus.current = {
      kind,
      route: `${location.pathname}${location.search}`,
      lang,
      userId: user?.id ?? null,
      query: filmQuery,
      selected,
      origin,
    };
  };

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
  if (!isAuth) return <Navigate to={path("/login")} replace state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }} />;
  if (requestedListValue !== null && (linkedLoading || linkedError || linkedList?.id !== requestedListId)) return <main className={styles.page} aria-labelledby="list-detail-title" aria-busy={linkedLoading}>
    <div className={styles.content}><h1 ref={listDetailHeadingRef} id="list-detail-title" tabIndex={-1} className={styles.retryFocusHeading}>{t("lists")}</h1>
      {linkedError ? <div className={styles.alert} role="alert">{t("loadListsError")} <RetryButton label={t("retry")} onClick={() => { rememberRetry("linked", document.activeElement as HTMLElement); setLinkedRetry(value => value + 1); }} /></div> : <p role="status">{t("loading")}</p>}
      <Link className={styles.browseFilms} to={path("/lists")}>{t("newList")}</Link>
    </div>
  </main>;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || draftFilms.length === 0 || createBusy) return;
    const requestId = ++listMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && listMutation.current === requestId;
    setCreateBusy(true);
    setError("");
    try {
      const { data } = await createList(name.trim(), description.trim(), isPublic, tags.split(",").map(tag => tag.trim()).filter(Boolean), draftFilms.map(film => film.id));
      if (!isCurrentRequest()) return;
      const createdListId = data.id;
      setListPage(0);
      setListsReload(value => value + 1);
      setName("");
      setDescription("");
      setIsPublic(false);
      setTags("");
      setDraftFilms([]);
      setFilmSearchOpen(false);
      setFilmQuery("");
      setError("");
      setStatus(t("listCreated"));
      navigate(path(`/lists?list=${createdListId}&mode=view`), { state: { listCreated: createdListId } });
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

  const selectedList = lists.find(list => list.id === selected)
    ?? (linkedList?.id === selected ? linkedList : null)
    ?? (selectedListSnapshot?.id === selected ? selectedListSnapshot : null);
  const listControlsBusy = listsLoading || itemsBusy || createBusy || saveBusy || deleting;
  const focusFilmSearch = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setFilmSearchOpen(true);
      window.requestAnimationFrame(() => filmQueryRef.current?.focus());
      return;
    }
    setFilmSearchOpen(open => !open);
  };
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
    setSelectedListSnapshot(null);
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
    setSelectedListSnapshot(list);
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
    const focusOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setItemsBusy(true);
    const reordered = [...items];
    const [moving] = reordered.splice(index, 1);
    reordered.splice(target, 0, moving);
    try {
      await reorderListItems(listId, reordered.map(item => item.id));
      if (!isCurrentRequest()) return;
      pendingReorderFocus.current = { itemId, origin: focusOrigin };
      setItems(reordered);
      setError("");
    } catch {
      if (isCurrentRequest()) {
        pendingReorderFocus.current = { itemId, origin: focusOrigin };
        setError(t("reorderListError"));
      }
    }
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
      <label className={styles.nameField} htmlFor="new-list-name">{t("listName")} <input ref={editorNameRef} id="new-list-name" required disabled={createBusy} value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
      <label className={styles.descriptionField} htmlFor="new-list-description">{t("description")} <textarea id="new-list-description" rows={5} disabled={createBusy} value={description} maxLength={5000} onChange={e => setDescription(e.target.value)} /></label>
      <div className={styles.createTags}>
        <label className={styles.tagsField} htmlFor="new-list-tags">{t("tags")} <input ref={tagsInputRef} id="new-list-tags" className={!tagsEditing && tags.trim() ? styles.tagsInputCollapsed : ""} value={tags} maxLength={509} disabled={createBusy} placeholder={t("tagsHint")} onChange={e => setTags(e.target.value)} onFocus={() => { if (tagsCollapseTimer.current !== null) window.clearTimeout(tagsCollapseTimer.current); tagsCollapseTimer.current = null; setTagsEditing(true); }} onBlur={() => { if (tagsCollapseTimer.current !== null) window.clearTimeout(tagsCollapseTimer.current); tagsCollapseTimer.current = window.setTimeout(() => { tagsCollapseTimer.current = null; setTagsEditing(false); }, 250); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (tagsCollapseTimer.current !== null) window.clearTimeout(tagsCollapseTimer.current); tagsCollapseTimer.current = null; setTagsEditing(false); if (tags.trim()) window.requestAnimationFrame(() => tagsToggleRef.current?.focus()); } }} /></label>
        {tags.trim() && <div className={styles.draftTags}>{tags.split(",").map(tag => tag.trim()).filter(Boolean).map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}<button ref={tagsToggleRef} type="button" disabled={createBusy} aria-label={t("tags")} onClick={() => { if (tagsCollapseTimer.current !== null) window.clearTimeout(tagsCollapseTimer.current); tagsCollapseTimer.current = null; setTagsEditing(true); window.requestAnimationFrame(() => tagsInputRef.current?.focus()); }}><img src="/images/list-create-tag-add.svg" alt="" width="16" height="16" /></button></div>}
      </div>
      <fieldset className={styles.createSettings}>
        <legend><span className={styles.settingsLegendMobile}>{t("settings")}</span><span className={styles.settingsLegendDesktop}>{t("whoCanView")}</span></legend>
        <label className={styles.checkboxLabel}><input type="checkbox" checked={isPublic} disabled={createBusy} onChange={e => setIsPublic(e.target.checked)} /><span className={styles.settingIcon}><img src="/images/list-create-public.svg" alt="" width="18" height="18" /></span> <span>{t("publicList")}</span></label>
        <p className={styles.rankingUnavailable}><span className={styles.settingIcon}><img src="/images/list-create-ranked.svg" alt="" width="18" height="18" /></span><span>{t("listRankingUnavailable")}</span></p>
      </fieldset>
      <section className={styles.draftFilms} aria-labelledby="draft-films-title">
        <div className={styles.draftFilmsHeading}><h2 id="draft-films-title">{t("films")}</h2><span>{draftFilms.length} {t("listEntries")}</span></div>
        <button className={styles.draftAddFilms} type="button" disabled={createBusy} aria-expanded={filmSearchOpen} aria-controls="draft-film-search" onClick={focusFilmSearch}><img src="/images/list-create-film-add.svg" alt="" width="18" height="18" />{t("addFilm")}</button>
        <div id="draft-film-search" className={styles.draftFilmSearch} hidden={!filmSearchOpen}>
          <label htmlFor="draft-film-query">{t("searchFilms")}</label>
            <input ref={filmQueryRef} id="draft-film-query" type="search" placeholder={t("searchFilmPlaceholder")} value={filmQuery} disabled={createBusy} onChange={event => setFilmQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); if (event.key === "Escape") { event.preventDefault(); setFilmSearchOpen(false); document.querySelector<HTMLButtonElement>(`[aria-controls="draft-film-search"]`)?.focus(); } }} />
          {filmSearchLoading && <p role="status">{t("loading")}</p>}
          {filmSearchError && <p role="alert">{t("loadFilmsError")} <RetryButton label={t("retry")} onClick={() => { rememberRetry("films", document.activeElement as HTMLElement); setFilmSearchRetry(value => value + 1); }} /></p>}
          {!filmSearchLoading && !filmSearchError && filmQuery.trim() && filmResults.length === 0 && <p>{t("noFilms")}</p>}
            {!filmSearchLoading && !filmSearchError && filmResults.length > 0 && <ul className={styles.draftResults}>{filmResults.map(film => <li key={film.id}><button type="button" disabled={createBusy || draftFilms.some(item => item.id === film.id)} onClick={() => setDraftFilms(current => current.some(item => item.id === film.id) ? current : [...current, film])}>{editorialText(film.title, t("untitledFilm"))} · {formatMovieYear(film.releaseDate, t("unknownYear"))}</button></li>)}</ul>}
        </div>
        {draftFilms.length === 0 ? <div className={styles.draftEmpty}><strong>{t("listNoFilmsTitle")}</strong><p>{t("listNoFilmsHint")}</p></div> : <ul className={styles.draftSelection}>{draftFilms.map(film => <li key={film.id}><span>{editorialText(film.title, t("untitledFilm"))}</span><button type="button" disabled={createBusy} aria-label={`${t("remove")} ${editorialText(film.title, t("untitledFilm"))}`} onClick={() => setDraftFilms(current => current.filter(item => item.id !== film.id))}>−</button></li>)}</ul>}
        <div className={styles.createActions}>
          <Link className={styles.createCancel} to={path("/profile?view=lists")} aria-disabled={createBusy || undefined} onClick={event => { if (createBusy) event.preventDefault(); }}>{t("cancel")}</Link>
          <button type="submit" aria-busy={createBusy} disabled={createBusy || !name.trim() || draftFilms.length === 0}>{createBusy ? t("saving") : t("save")}</button>
        </div>
      </section>
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
          <h2 ref={selectedHeadingRef} id="selected-list-heading" tabIndex={-1} className={styles.retryFocusHeading}>{editorialText(selectedList.name, t("lists"))}</h2>
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
        <label className={styles.nameField} htmlFor="edit-list-name">{t("listName")} <input ref={editorNameRef} id="edit-list-name" required maxLength={120} disabled={itemsBusy || saveBusy || deleting} value={editName} onChange={event => setEditName(event.target.value)} aria-invalid={!editName.trim()} aria-describedby={!editName.trim() ? "edit-list-name-error" : undefined} />{!editName.trim() && <span className={styles.nameError} id="edit-list-name-error" role="alert">{t("listNameRequired")}</span>}</label>
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
          <button type="submit" aria-busy={saveBusy} disabled={itemsBusy || saveBusy || deleting || !editName.trim()}>{saveBusy ? t("saving") : t("save")}</button>
        </div>
      </form>}
      {itemsLoading && <div className={styles.stateCard} role="status"><span className={styles.stateMark} aria-hidden="true">…</span><strong>{t("loading")}</strong></div>}
      {itemsLoadError && <div className={`${styles.stateCard} ${styles.stateError}`} role="alert"><strong>{t("loadItemsError")}</strong><RetryButton label={t("retry")} onClick={() => { rememberRetry("items", document.activeElement as HTMLElement); setItemsReload(value => value + 1); }} /></div>}
      {!detailMode && !itemsLoading && !itemsLoadError && selectedList.listType === "CUSTOM" && items.length === 1 && <p className={styles.heroCopy}>{t("listKeepOneFilm")}</p>}
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
            <button className={styles.itemRemoveButton} type="button" aria-busy={itemsBusy} disabled={itemsBusy || saveBusy || deleting || (selectedList.listType === "CUSTOM" && items.length === 1)} onClick={() => void remove(item.movie.id)}>
              <span aria-hidden="true">−</span><span className="srOnly">{t("remove")}</span>
            </button>
            {selectedList.listType === "CUSTOM" && <>
              <button className={styles.mobileMoveHandle} type="button" data-list-reorder-item={item.id} draggable={!itemsBusy && !saveBusy && !deleting} disabled={itemsBusy || saveBusy || deleting} aria-label={`${t("reorderItem")} ${movieTitle}`} aria-describedby="list-reorder-instructions" aria-keyshortcuts="ArrowUp ArrowDown" onKeyDown={event => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                void moveToIndex(item.id, index + (event.key === "ArrowUp" ? -1 : 1));
              }} onDragStart={event => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(item.id));
              }}>
                <span aria-hidden="true">✥</span>
              </button>
              <button className={styles.itemMoveButton} type="button" data-list-reorder-item={item.id} aria-busy={itemsBusy} disabled={itemsBusy || saveBusy || deleting || index === 0} onClick={() => void move(item.id, -1)} aria-label={t("moveUp")}>↑</button>
              <button className={styles.itemMoveButton} type="button" data-list-reorder-item={item.id} aria-busy={itemsBusy} disabled={itemsBusy || saveBusy || deleting || index === items.length - 1} onClick={() => void move(item.id, 1)} aria-label={t("moveDown")}>↓</button>
            </>}
          </div>}
        </li>;
        })}</ul>
      </>}
    </section>}
    <section className={`${styles.section} ${styles.listPicker}`} aria-labelledby="my-lists-heading" aria-busy={listsLoading}>
      <h2 ref={listsHeadingRef} id="my-lists-heading" tabIndex={-1} className={styles.retryFocusHeading}>{t("lists")}</h2>
      {listsLoading && <div className={styles.stateCard} role="status"><span className={styles.stateMark} aria-hidden="true">…</span><strong>{t("loading")}</strong></div>}
      {listsLoadError && <p className={styles.alert} role="alert">{t("loadListsError")} <RetryButton label={t("retry")} onClick={() => { rememberRetry("lists", document.activeElement as HTMLElement); setListsReload(value => value + 1); }} /></p>}
      {!listsLoading && !listsLoadError && lists.length === 0 && <p>{t("noLists")}</p>}
      {!listsLoading && !listsLoadError && <div className={styles.listButtons}>
        {lists.map(list => <button key={list.id} type="button" disabled={listControlsBusy} onClick={() => select(list)} aria-pressed={selected === list.id}>{editorialText(list.name, t("lists"))}</button>)}
      </div>}
      {!listsLoading && !listsLoadError && <Pagination className={styles.pagination} page={listPage} totalPages={listTotalPages} label={t("listsPagination")} busy={listControlsBusy} statusSuffix={listTotalElements} onPageChange={setListPage} />}
    </section>
    </div>
    <ConfirmDialog open={pendingListDelete !== null} title={t("deleteList")} description={t("deleteListConfirm")} cancelLabel={t("cancel")} confirmLabel={t("deleteList")} trigger={pendingListDelete?.trigger ?? null} onCancel={() => setPendingListDelete(null)} onConfirm={() => { const id = pendingListDelete?.id; setPendingListDelete(null); if (id !== undefined) void removeList(id); }} />
  </main>;
}
