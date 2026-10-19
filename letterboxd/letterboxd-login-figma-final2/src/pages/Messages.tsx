import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getConversations, getMessages, markConversationRead, sendMessage, startConversation, type Conversation, type Message, type Page } from "../api/messages.api";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatDateTime, useLocale } from "../i18n";
import styles from "./Messages.module.css";

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
  const [targetConversationLoading, setTargetConversationLoading] = useState(false);
  const [targetConversationError, setTargetConversationError] = useState(false);
  const [targetConversationAttempt, setTargetConversationAttempt] = useState(0);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Page<Message> | null>(null);
  const [messagePage, setMessagePage] = useState(0);
  const [messageRevision, setMessageRevision] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [readError, setReadError] = useState(false);
  const [readRetrying, setReadRetrying] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

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
    if (!isAuth || !Number.isInteger(targetUserId) || targetUserId < 1 || targetUserId === user?.id) {
      setTargetConversationLoading(false);
      setTargetConversationError(false);
      return;
    }
    let current = true;
    setSelected(null);
    setTargetConversationLoading(true);
    setTargetConversationError(false);
    startConversation(targetUserId)
      .then(({ data }) => {
        if (!current) return;
        setSelected(data);
        setMessagePage(0);
        setConversationPage(0);
        setConversationRevision(value => value + 1);
        setSearchParams({}, { replace: true });
      })
      .catch(() => { if (current) setTargetConversationError(true); })
      .finally(() => { if (current) setTargetConversationLoading(false); });
    return () => { current = false; };
  }, [isAuth, setSearchParams, targetConversationAttempt, targetUserId, user?.id]);

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
    setReadError(false);
    setReadRetrying(false);
    getMessages(selected.id, messagePage)
      .then(({ data }) => {
        if (!current) return;
        setMessages(data);
        void markConversationRead(selected.id).catch(() => { if (current) setReadError(true); });
      })
      .catch(() => { if (current) setMessagesError(true); })
      .finally(() => { if (current) setMessagesLoading(false); });
    return () => { current = false; };
  }, [messagePage, messageRevision, selected]);

  if (!ready) return <main className={styles.page}><div className={styles.shell}><h1 className="srOnly">{t("messages")}</h1><p className={styles.notice}>{t("loading")}</p></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const chooseConversation = (conversation: Conversation) => {
    setTargetConversationLoading(false);
    setTargetConversationError(false);
    if (searchParams.has("user")) setSearchParams({}, { replace: true });
    setSelected(conversation);
    setMessagePage(0);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendCurrentMessage();
  };

  const sendCurrentMessage = async () => {
    if (!selected || !body.trim() || sending) return;
    setSending(true);
    setSendError(false);
    try {
      await sendMessage(selected.id, body.trim());
      setBody("");
      setMessagePage(0);
      setMessageRevision(value => value + 1);
      setConversationPage(0);
      setConversationRevision(value => value + 1);
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const retryMarkRead = async () => {
    if (!selected || readRetrying) return;
    setReadRetrying(true);
    setReadError(false);
    try {
      await markConversationRead(selected.id);
    } catch {
      setReadError(true);
    } finally {
      setReadRetrying(false);
    }
  };

  return <main className={styles.page}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("socialEyebrow")}</p>
        <h1>{t("messages")}</h1>
        <p>{t("messagesIntro")}</p>
      </section>
      <div className={styles.layout}>
        <aside className={styles.panel} aria-label={t("conversations")} aria-busy={conversationsLoading}>
          <h2>{t("conversations")}</h2>
          {conversationsLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
          {conversationsError && <div className={styles.error}><p role="alert">{t("loadConversationsError")}</p><button type="button" onClick={() => setConversationRevision(value => value + 1)}>{t("retry")}</button></div>}
          {!conversationsLoading && !conversationsError && conversations?.content.length === 0 && <p className={styles.empty}>{t("noConversations")}</p>}
          {!conversationsLoading && !conversationsError && conversations && conversations.content.length > 0 && <ul className={styles.conversationList}>
            {conversations.content.map(item => {
              const name = item.otherUser.displayName?.trim() || (item.otherUser.username?.trim() ? `@${item.otherUser.username}` : t("someone"));
              return <li key={item.id}><button className={`${styles.conversationButton} ${selected?.id === item.id ? styles.conversationButtonSelected : ""}`} type="button" onClick={() => chooseConversation(item)} aria-pressed={selected?.id === item.id}><strong>{name}</strong>{item.lastMessage && <small>{editorialText(item.lastMessage.body, "—")}</small>}</button></li>;
            })}
          </ul>}
          {conversations && conversations.totalPages > 1 && <nav className={styles.pagination} aria-label={t("conversationsPagination")}>
            <button type="button" disabled={conversationsLoading || conversationPage === 0} onClick={() => setConversationPage(value => value - 1)}>{t("previous")}</button>
            <span role="status">{t("page")} {conversationPage + 1} {t("of")} {conversations.totalPages}</span>
            <button type="button" disabled={conversationsLoading || conversationPage + 1 >= conversations.totalPages} onClick={() => setConversationPage(value => value + 1)}>{t("next")}</button>
          </nav>}
        </aside>
        <section className={styles.panel} aria-labelledby={selected ? "conversation-title" : undefined} aria-label={selected ? undefined : t("messages")} aria-busy={messagesLoading || targetConversationLoading || sending}>
          {!selected && targetConversationLoading && <div className={styles.panelState}><p className={styles.notice} role="status">{t("loading")}</p></div>}
          {!selected && targetConversationError && <div className={styles.panelState}><div className={styles.error}><p role="alert">{t("startConversationError")}</p><button type="button" onClick={() => setTargetConversationAttempt(value => value + 1)}>{t("retry")}</button></div></div>}
          {!selected && !targetConversationLoading && !targetConversationError && <div className={styles.panelState}><p className={styles.empty}>{t("chooseConversation")}</p></div>}
          {selected && <>
            <h2 className={styles.conversationTitle} id="conversation-title"><Link to={path(`/users/${selected.otherUser.id}`)}>{selected.otherUser.displayName?.trim() || (selected.otherUser.username?.trim() ? `@${selected.otherUser.username}` : t("someone"))}</Link></h2>
            {messagesLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
            {messagesError && <div className={styles.error}><p role="alert">{t("loadMessagesError")}</p><button type="button" onClick={() => setMessageRevision(value => value + 1)}>{t("retry")}</button></div>}
            {readError && <div className={styles.error}><p role="alert">{t("markMessagesReadError")}</p><button type="button" onClick={() => void retryMarkRead()} disabled={readRetrying}>{readRetrying ? t("loading") : t("retry")}</button></div>}
            {!messagesLoading && !messagesError && messages?.content.length === 0 && <p className={styles.empty}>{t("noMessages")}</p>}
            {!messagesLoading && !messagesError && messages && messages.content.length > 0 && <ul className={styles.messageList}>
              {[...messages.content].reverse().map(item => <li className={`${styles.messageBubble} ${item.senderId === user?.id ? styles.messageBubbleOwn : ""}`} key={item.id}><div>{editorialText(item.body, "—")}</div><small>{formatDateTime(item.createdAt, lang)}</small></li>)}
            </ul>}
            {messages && messages.totalPages > 1 && <nav className={styles.pagination} aria-label={t("messagesPagination")}>
              <button type="button" disabled={messagesLoading || messagePage === 0} onClick={() => setMessagePage(value => value - 1)}>{t("newerMessages")}</button>
              <span role="status">{t("page")} {messagePage + 1} {t("of")} {messages.totalPages}</span>
              <button type="button" disabled={messagesLoading || messagePage + 1 >= messages.totalPages} onClick={() => setMessagePage(value => value + 1)}>{t("olderMessages")}</button>
            </nav>}
            <form className={styles.composer} onSubmit={submit} aria-busy={sending}>
              {sendError && <div className={styles.error}><p role="alert">{t("sendMessageError")}</p><button type="button" disabled={sending || !body.trim()} onClick={() => void sendCurrentMessage()}>{t("retry")}</button></div>}
              <input aria-label={t("messageText")} value={body} maxLength={2000} onChange={event => { setBody(event.target.value); setSendError(false); }} placeholder={t("messageText")} />
              <button type="submit" aria-busy={sending} disabled={!body.trim() || sending}>{sending ? t("loading") : t("sendMessage")}</button>
            </form>
          </>}
        </section>
      </div>
    </div>
  </main>;
}
