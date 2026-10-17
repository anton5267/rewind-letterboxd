import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useLocale } from "../i18n";

interface Tag { id: number; name: string; slug: string }
interface PublicList { id: number; name: string; description: string | null; ownerId: number; ownerUsername: string; tags: string[] }
interface Page<T> { content: T[] }

export default function PublicLists() {
  const { path, t, lang } = useLocale();
  const [searchParams] = useSearchParams();
  const tag = searchParams.get("tag") ?? "";
  const [lists, setLists] = useState<PublicList[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    Promise.all([
      api.get<Page<PublicList>>("/lists/public", { params: { tag: tag || undefined, size: 30 } }),
      api.get<Tag[]>("/tags/popular", { params: { size: 30 } }),
    ]).then(([listsResponse, tagsResponse]) => {
      if (!current) return;
      setLists(listsResponse.data.content);
      setTags(tagsResponse.data);
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [tag, lang]);

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("discoverLists")}</h1>
    <section>
      <h2>{t("popularTags")}</h2>
      {tags.length === 0 ? <p>{t("noTags")}</p> : <p style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Link to={path("/lists/discover")}>{t("viewAll")}</Link>
        {tags.map(item => <Link key={item.id} to={path(`/lists/discover?tag=${encodeURIComponent(item.slug)}`)}>#{item.name}</Link>)}
      </p>}
    </section>
    {loading && <p>{t("loading")}</p>}
    {error && <p role="alert">{t("loadPublicListError")}</p>}
    {!loading && !error && <section>
      {lists.length === 0 ? <p>{tag ? t("noTaggedLists") : t("noPublicLists")}</p> : <ul>{lists.map(list => <li key={list.id}>
        <h2><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link></h2>
        {list.description && <p>{list.description}</p>}
        {list.tags.length > 0 && <p>{list.tags.map(name => `#${name}`).join(" · ")}</p>}
        <small>{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link></small>
      </li>)}</ul>}
    </section>}
  </main>;
}
