import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createList, getListItems, getUserLists, removeMovieFromList, reorderListItems, updateList } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface List { id: number; name: string; description: string | null; listType: string; isPublic: boolean }
interface Item { id: number; position: number | null; movie: { id: number; title: string } }

export default function UserLists() {
  const { isAuth, ready } = useAuth();
  const { path, t } = useLocale();
  const [lists, setLists] = useState<List[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuth) getUserLists().then(({ data }) => setLists(data)).catch(() => setError(t("loadListsError")));
  }, [isAuth]);
  useEffect(() => {
    if (selected != null) getListItems(selected).then(({ data }) => setItems(data)).catch(() => setError(t("loadItemsError")));
  }, [selected]);

  if (!ready) return <main>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await createList(name.trim(), description.trim(), isPublic);
      const { data } = await getUserLists();
      setLists(data);
      setName("");
      setDescription("");
      setIsPublic(false);
      setError("");
    } catch { setError(t("createListError")); }
  };

  const remove = async (movieId: number) => {
    if (selected == null) return;
    try {
      await removeMovieFromList(selected, movieId);
      setItems(items.filter(item => item.movie.id !== movieId));
    } catch { setError(t("removeItemError")); }
  };

  const selectedList = lists.find(list => list.id === selected) ?? null;
  const select = (list: List) => {
    setSelected(list.id);
    setEditName(list.name);
    setEditDescription(list.description ?? "");
    setEditPublic(list.isPublic);
  };

  const saveList = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedList || selectedList.listType !== "CUSTOM" || !editName.trim()) return;
    try {
      const { data } = await updateList(selectedList.id, editName.trim(), editDescription.trim(), editPublic);
      setLists(lists.map(list => list.id === data.id ? data : list));
      setError("");
    } catch { setError(t("updateListError")); }
  };

  const move = async (itemId: number, direction: -1 | 1) => {
    if (selected == null) return;
    const index = items.findIndex(item => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      await reorderListItems(selected, reordered.map(item => item.id));
      setItems(reordered);
      setError("");
    } catch { setError(t("reorderListError")); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("lists")}</h1>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={create}>
      <label>{t("newList")} <input required value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>{" "}
      <label>{t("description")} <input value={description} maxLength={5000} onChange={e => setDescription(e.target.value)} /></label>{" "}
      <label><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> {t("publicList")}</label>{" "}
      <button type="submit">{t("create")}</button>
    </form>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
      {lists.map(list => <button key={list.id} type="button" onClick={() => select(list)} aria-pressed={selected === list.id}>{list.name}</button>)}
    </div>
    {selectedList && <section>
      <h2>{selectedList.name}</h2>
      {selectedList.listType === "CUSTOM" && <form onSubmit={saveList} style={{ marginBottom: 16 }}>
        <label>{t("listName")} <input required maxLength={120} value={editName} onChange={event => setEditName(event.target.value)} /></label>{" "}
        <label>{t("description")} <input maxLength={5000} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label>{" "}
        <label><input type="checkbox" checked={editPublic} onChange={event => setEditPublic(event.target.checked)} /> {t("publicList")}</label>{" "}
        <button type="submit">{t("save")}</button>
      </form>}
      {items.length === 0 && <p>{t("emptyList")}</p>}
      <ul>{items.map((item, index) => <li key={item.id}>
        <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>{" "}
        <button type="button" onClick={() => void remove(item.movie.id)}>{t("remove")}</button>
        {selectedList.listType === "CUSTOM" && <><button type="button" disabled={index === 0} onClick={() => void move(item.id, -1)} aria-label={t("moveUp")}>↑</button>{" "}<button type="button" disabled={index === items.length - 1} onClick={() => void move(item.id, 1)} aria-label={t("moveDown")}>↓</button></>}
      </li>)}</ul>
    </section>}
  </main>;
}
