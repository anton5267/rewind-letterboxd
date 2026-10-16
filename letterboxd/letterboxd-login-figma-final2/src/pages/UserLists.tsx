import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createList, getListItems, getUserLists, removeMovieFromList } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface List { id: number; name: string; listType: string; isPublic: boolean }
interface Item { id: number; movie: { id: number; title: string } }

export default function UserLists() {
  const { isAuth } = useAuth();
  const { path, t } = useLocale();
  const [lists, setLists] = useState<List[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuth) getUserLists().then(({ data }) => setLists(data)).catch(() => setError(t("loadListsError")));
  }, [isAuth]);
  useEffect(() => {
    if (selected != null) getListItems(selected).then(({ data }) => setItems(data)).catch(() => setError(t("loadItemsError")));
  }, [selected]);

  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await createList(name.trim());
      const { data } = await getUserLists();
      setLists(data);
      setName("");
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

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("lists")}</h1>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={create}>
      <label>{t("newList")} <input value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
      <button type="submit">{t("create")}</button>
    </form>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
      {lists.map(list => <button key={list.id} type="button" onClick={() => setSelected(list.id)} aria-pressed={selected === list.id}>{list.name}</button>)}
    </div>
    {selected != null && <section>
      <h2>{lists.find(list => list.id === selected)?.name}</h2>
      {items.length === 0 && <p>{t("emptyList")}</p>}
      <ul>{items.map(item => <li key={item.id}>
        <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>{" "}
        <button type="button" onClick={() => void remove(item.movie.id)}>{t("remove")}</button>
      </li>)}</ul>
    </section>}
  </main>;
}
