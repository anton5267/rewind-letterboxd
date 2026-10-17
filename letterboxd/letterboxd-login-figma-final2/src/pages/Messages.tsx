import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getConversations, getMessages, markConversationRead, sendMessage, startConversation, type Conversation, type Message, type Page } from "../api/messages.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

export default function Messages() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Page<Message> | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    getConversations().then(({ data }) => setConversations(data.content)).catch(() => setError(true));
  }, [isAuth]);

  useEffect(() => {
    if (!isAuth) return;
    const target = Number(searchParams.get("user"));
    if (!target || target === user?.id) return;
    startConversation(target).then(({ data }) => { setConversations(current => current.some(item => item.id === data.id) ? current : [data, ...current]); setSelectedId(data.id); setSearchParams({}, { replace: true }); }).catch(() => setError(true));
  }, [isAuth, user?.id, searchParams]);

  useEffect(() => {
    if (!selectedId) { setMessages(null); return; }
    setLoading(true);
    getMessages(selectedId).then(({ data }) => { setMessages(data); void markConversationRead(selectedId); }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [selectedId]);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const selected = conversations.find(item => item.id === selectedId) ?? null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !body.trim()) return;
    try {
      const { data } = await sendMessage(selectedId, body.trim());
      setMessages(current => current ? { ...current, content: [data, ...current.content] } : { content: [data], totalPages: 1, totalElements: 1 });
      setConversations(current => current.map(item => item.id === selectedId ? { ...item, updatedAt: data.createdAt, lastMessage: data } : item));
      setBody("");
    } catch { setError(true); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("messages")}</h1>
    {error && <p role="alert">{t("messagesError")}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 280px) minmax(0, 1fr)", gap: 20 }}>
      <aside aria-label={t("conversations")}>
        {conversations.length === 0 ? <p>{t("noConversations")}</p> : <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {conversations.map(item => <li key={item.id}><button type="button" onClick={() => setSelectedId(item.id)} aria-pressed={selectedId === item.id} style={{ width: "100%", textAlign: "left", padding: 10 }}><strong>{item.otherUser.displayName || `@${item.otherUser.username}`}</strong>{item.lastMessage && <small style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.lastMessage.body}</small>}</button></li>)}
        </ul>}
      </aside>
      <section aria-labelledby="conversation-title">
        {!selected ? <p>{t("chooseConversation")}</p> : <>
          <h2 id="conversation-title"><Link to={path(`/users/${selected.otherUser.id}`)}>{selected.otherUser.displayName || `@${selected.otherUser.username}`}</Link></h2>
          {loading && <p>{t("loading")}</p>}
          {!loading && messages && <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {[...messages.content].reverse().map(item => <li key={item.id} style={{ maxWidth: "75%", justifySelf: item.senderId === user?.id ? "end" : "start", background: item.senderId === user?.id ? "#3b3150" : "#292929", padding: 10, borderRadius: 8 }}><div>{item.body}</div><small>{new Date(item.createdAt).toLocaleString()}</small></li>)}
          </ul>}
          <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 16 }}><input aria-label={t("messageText")} value={body} maxLength={2000} onChange={event => setBody(event.target.value)} placeholder={t("messageText")} /><button type="submit" disabled={!body.trim()}>{t("sendMessage")}</button></form>
        </>}
      </section>
    </div>
  </main>;
}
