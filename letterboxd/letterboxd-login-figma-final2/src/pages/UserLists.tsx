import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createList, deleteList, getListItems, getUserListsPage, removeMovieFromList, reorderListItems, updateList, type UserList } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface Item { id: number; position: number | null; movie: { id: number; title: string } }

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
  const [items, setItems] = useState<Item[]>([]);
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
      setItems(items.filter(item => item.movie.id !== movieId));
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
      setLists(lists.map(list => list.id === data.id ? data : list));
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

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("lists")}</h1>
    {error && <p role="alert">{error}</p>}
    {status && <p role="status">{status}</p>}
    <form onSubmit={create}>
      <label>{t("newList")} <input required value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>{" "}
      <label>{t("description")} <input value={description} maxLength={5000} onChange={e => setDescription(e.target.value)} /></label>{" "}
      <label>{t("tags")} <input value={tags} maxLength={509} placeholder={t("tagsHint")} onChange={e => setTags(e.target.value)} /></label>{" "}
      <label><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> {t("publicList")}</label>{" "}
      <button type="submit" disabled={createBusy}>{createBusy ? t("saving") : t("create")}</button>
    </form>
    <section aria-labelledby="my-lists-heading" style={{ marginTop: 24 }}>
      <h2 id="my-lists-heading">{t("lists")}</h2>
      {listsLoading && <p aria-live="polite">{t("loading")}</p>}
      {listsLoadError && <p role="alert">{t("loadListsError")} <button type="button" onClick={() => setListsReload(value => value + 1)}>{t("retry")}</button></p>}
      {!listsLoading && !listsLoadError && lists.length === 0 && <p>{t("noLists")}</p>}
      {!listsLoading && !listsLoadError && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {lists.map(list => <button key={list.id} type="button" onClick={() => select(list)} aria-pressed={selected === list.id}>{list.name}</button>)}
      </div>}
      {!listsLoading && !listsLoadError && listTotalPages > 1 && <nav aria-label={t("listsPagination")} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" disabled={listPage === 0} onClick={() => { setSelected(null); setListPage(page => page - 1); }}>{t("previous")}</button>
        <span>{t("page")} {listPage + 1} {t("of")} {listTotalPages} · {listTotalElements}</span>
        <button type="button" disabled={listPage + 1 >= listTotalPages} onClick={() => { setSelected(null); setListPage(page => page + 1); }}>{t("next")}</button>
      </nav>}
    </section>
    {selectedList && <section>
      <h2>{selectedList.name}</h2>
      {selectedList.listType === "CUSTOM" && <form onSubmit={saveList} style={{ marginBottom: 16 }}>
        <label>{t("listName")} <input required maxLength={120} value={editName} onChange={event => setEditName(event.target.value)} /></label>{" "}
        <label>{t("description")} <input maxLength={5000} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label>{" "}
        <label>{t("tags")} <input value={editTags} maxLength={509} placeholder={t("tagsHint")} onChange={event => setEditTags(event.target.value)} /></label>{" "}
        <label><input type="checkbox" checked={editPublic} onChange={event => setEditPublic(event.target.checked)} /> {t("publicList")}</label>{" "}
        <button type="submit" disabled={saveBusy}>{saveBusy ? t("saving") : t("save")}</button>
        {" "}<button type="button" disabled={deleting || saveBusy} onClick={() => void removeList()}>{deleting ? t("deletingList") : t("deleteList")}</button>
      </form>}
      {itemsLoading && <p role="status">{t("loading")}</p>}
      {itemsLoadError && <p role="alert">{t("loadItemsError")} <button type="button" onClick={() => setItemsReload(value => value + 1)}>{t("retry")}</button></p>}
      {!itemsLoading && !itemsLoadError && items.length === 0 && <p>{t("emptyList")}</p>}
      {!itemsLoading && !itemsLoadError && <ul>{items.map((item, index) => <li key={item.id}>
        <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>{" "}
        <button type="button" disabled={itemsBusy} onClick={() => void remove(item.movie.id)}>{t("remove")}</button>
        {selectedList.listType === "CUSTOM" && <><button type="button" disabled={itemsBusy || index === 0} onClick={() => void move(item.id, -1)} aria-label={t("moveUp")}>↑</button>{" "}<button type="button" disabled={itemsBusy || index === items.length - 1} onClick={() => void move(item.id, 1)} aria-label={t("moveDown")}>↓</button></>}
      </li>)}</ul>}
    </section>}
  </main>;
}
