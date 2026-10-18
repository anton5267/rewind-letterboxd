import { useEffect, useState } from "react";
import { deleteAdminList, getAdminLists, setAdminListVisibility, type AdminList, type Page } from "../api/admin.api";
import { useLocale } from "../i18n";

export default function AdminLists() {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminList> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminLists(page)
      .then(({ data: response }) => { if (current) setData(response); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, revision]);

  const toggleVisibility = async (list: AdminList) => {
    if (busyId !== null) return;
    setBusyId(list.id);
    try {
      const { data: updated } = await setAdminListVisibility(list.id, !list.isPublic);
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (list: AdminList) => {
    if (list.listType !== "CUSTOM" || busyId !== null || !window.confirm(t("deleteListConfirm"))) return;
    setBusyId(list.id);
    try {
      await deleteAdminList(list.id);
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  };

  return <section aria-label={t("adminLists")} aria-busy={loading}>
    <h2>{t("adminLists")}</h2>
    {loading && <p>{t("loading")}</p>}
    {error && <div><p role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminLists")}</p>}
    {data && <>
      <ul>{data.content.map(list => <li key={list.id} style={{ marginBottom: 8 }}>
        {list.name} · {list.username} · {list.itemCount} {t("items")} · {list.isPublic ? t("publicList") : t("hiddenList")}{" "}
        <button type="button" disabled={busyId !== null} onClick={() => void toggleVisibility(list)}>{list.isPublic ? t("hideList") : t("publishList")}</button>
        {list.listType === "CUSTOM" && <button type="button" disabled={busyId !== null} onClick={() => void remove(list)}>{t("deleteList")}</button>}
      </li>)}</ul>
      <nav aria-label={t("adminListsPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
