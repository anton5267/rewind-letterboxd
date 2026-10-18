import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getConversations, getMessages, markConversationRead, sendMessage, startConversation, type Conversation, type Message, type Page } from "../api/messages.api";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, useLocale } from "../i18n";

export default function Messages() {
  const { isAuth, ready, user } = useAuth();
  const { lang, path, t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = Number(searchParams.get("user"));
  const [conversations, setConversations] = useState<Page<Conversation> | null>(null);
  const [conversationPage, setConversationPage] = useState(0);
  const [conversationRevision, setConversationRevision] = useState(0);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Page<Message> | null>(null);
  const [messagePage, setMessagePage] = useState(0);
  const [messageRevision, setMessageRevision] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setConversationsLoading(true);
    setConversationsError(false);
    getConversations(conversationPage)
      .then(({ data }) => { if (current) setConversations(data); })
      .catch(() => { if (current) setConversationsError(true); })
      .finally(() => { if (current) setConversationsLoading(false); });
    return () => { current = false; };
  }, [isAuth, conversationPage, conversationRevision]);

  useEffect(() => {
    if (!isAuth || !Number.isInteger(targetUserId) || targetUserId < 1 || targetUserId === user?.id) return;
    let current = true;
    setConversationsError(false);
    startConversation(targetUserId)
      .then(({ data }) => {
        if (!current) return;
        setSelected(data);
        setMessagePage(0);
        setConversationPage(0);
        setConversationRevision(value => value + 1);
        setSearchParams({}, { replace: true });
      })
      .catch(() => { if (current) setConversationsError(true); });
    return () => { current = false; };
  }, [isAuth, setSearchParams, targetUserId, user?.id]);

  useEffect(() => {
    if (!selected) {
      setMessages(null);
      setMessagesLoading(false);
      setMessagesError(false);
      return;
    }
    let current = true;
    setMessages(null);
    setMessagesLoading(true);
    setMessagesError(false);
    getMessages(selected.id, messagePage)
      .then(({ data }) => {
        if (!current) return;
        setMessages(data);
        void markConversationRead(selected.id).catch(() => { if (current) setMessagesError(true); });
      })
      .catch(() => { if (current) setMessagesError(true); })
      .finally(() => { if (current) setMessagesLoading(false); });
    return () => { current = false; };
  }, [messagePage, messageRevision, selected]);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const chooseConversation = (conversation: Conversation) => {
    setSelected(conversation);
    setMessagePage(0);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !body.trim() || sending) return;
    setSending(true);
    setMessagesError(false);
    try {
      await sendMessage(selected.id, body.trim());
      setBody("");
      setMessagePage(0);
      setMessageRevision(value => value + 1);
      setConversationPage(0);
      setConversationRevision(value => value + 1);
    } catch {
      setMessagesError(true);
    } finally {
      setSending(false);
    }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("messages")}</h1>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
      <aside aria-label={t("conversations")} aria-busy={conversationsLoading}>
        <h2>{t("conversations")}</h2>
        {conversationsLoading && <p role="status">{t("loading")}</p>}
        {conversationsError && <div><p role="alert">{t("loadConversationsError")}</p><button type="button" onClick={() => setConversationRevision(value => value + 1)}>{t("retry")}</button></div>}
        {!conversationsLoading && !conversationsError && conversations?.content.length === 0 && <p>{t("noConversations")}</p>}
        {!conversationsLoading && !conversationsError && conversations && conversations.content.length > 0 && <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {conversations.content.map(item => <li key={item.id}><button type="button" onClick={() => chooseConversation(item)} aria-pressed={selected?.id === item.id} style={{ width: "100%", textAlign: "left", padding: 10 }}><strong>{item.otherUser.displayName || `@${item.otherUser.username}`}</strong>{item.lastMessage && <small style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.lastMessage.body}</small>}</button></li>)}
        </ul>}
        {conversations && conversations.totalPages > 1 && <nav aria-label={t("conversationsPagination")} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <button type="button" disabled={conversationsLoading || conversationPage === 0} onClick={() => setConversationPage(value => value - 1)}>{t("previous")}</button>
          <span role="status">{t("page")} {conversationPage + 1} {t("of")} {conversations.totalPages}</span>
          <button type="button" disabled={conversationsLoading || conversationPage + 1 >= conversations.totalPages} onClick={() => setConversationPage(value => value + 1)}>{t("next")}</button>
        </nav>}
      </aside>
      <section aria-labelledby="conversation-title" aria-busy={messagesLoading}>
        {!selected ? <p>{t("chooseConversation")}</p> : <>
          <h2 id="conversation-title"><Link to={path(`/users/${selected.otherUser.id}`)}>{selected.otherUser.displayName || `@${selected.otherUser.username}`}</Link></h2>
          {messagesLoading && <p role="status">{t("loading")}</p>}
          {messagesError && <div><p role="alert">{t("loadMessagesError")}</p><button type="button" onClick={() => setMessageRevision(value => value + 1)}>{t("retry")}</button></div>}
          {!messagesLoading && !messagesError && messages?.content.length === 0 && <p>{t("noMessages")}</p>}
          {!messagesLoading && !messagesError && messages && messages.content.length > 0 && <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {[...messages.content].reverse().map(item => <li key={item.id} style={{ maxWidth: "75%", justifySelf: item.senderId === user?.id ? "end" : "start", background: item.senderId === user?.id ? "#3b3150" : "#292929", padding: 10, borderRadius: 8 }}><div>{item.body}</div><small>{formatDateTime(item.createdAt, lang)}</small></li>)}
          </ul>}
          {messages && messages.totalPages > 1 && <nav aria-label={t("messagesPagination")} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button type="button" disabled={messagesLoading || messagePage === 0} onClick={() => setMessagePage(value => value - 1)}>{t("newerMessages")}</button>
            <span role="status">{t("page")} {messagePage + 1} {t("of")} {messages.totalPages}</span>
            <button type="button" disabled={messagesLoading || messagePage + 1 >= messages.totalPages} onClick={() => setMessagePage(value => value + 1)}>{t("olderMessages")}</button>
          </nav>}
          <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}><input aria-label={t("messageText")} value={body} maxLength={2000} onChange={event => setBody(event.target.value)} placeholder={t("messageText")} style={{ flex: "1 1 220px", minWidth: 0 }} /><button type="submit" disabled={!body.trim() || sending}>{sending ? t("loading") : t("sendMessage")}</button></form>
        </>}
      </section>
    </div>
  </main>;
}
