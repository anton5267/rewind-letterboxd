import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { getConversations, getMessages, markConversationRead, sendMessage, startConversation, type Conversation, type Message } from "../api/messages.api";
import Pagination from "../components/Pagination";
import RetryNotice from "../components/RetryNotice";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatDateTime, useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { getUserIdentity } from "../utils/userIdentity";
import { notifyUnreadCountsChanged } from "../utils/unreadEvents";
import type { Page } from "../api/types";
import { useMessageUpdates } from "../hooks/useMessageUpdates";
import styles from "./Messages.module.css";

export default function Messages() {
  const { isAuth, ready, user } = useAuth();
  const { lang, path, t } = useLocale();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = Number(searchParams.get("user"));
  const validTargetUserId = Number.isSafeInteger(targetUserId) && targetUserId > 0;
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
  const targetConversationRequest = useRef(0);
  const activeUserId = useRef<number | null>(null);
  const activeConversationId = useRef<number | null>(null);
  const sendRequest = useRef(0);
  const readRequest = useRef(0);
  const sendFocus = useRef<{ conversationId: number; origin: HTMLElement | null; composerOrigin: boolean } | null>(null);
  const retryFocus = useRef<{ target: "conversations" | "target-conversation" | "messages" | "read" | "refresh"; origin: HTMLElement | null } | null>(null);
  const conversationsPanel = useRef<HTMLElement | null>(null);
  const messagePanel = useRef<HTMLElement | null>(null);
  const scrollToLatest = useRef(false);

  useLayoutEffect(() => {
    if (!scrollToLatest.current) return;
    scrollToLatest.current = false;
    const log = messagePanel.current?.querySelector<HTMLElement>("[role=log]");
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  activeUserId.current = user?.id ?? null;
  activeConversationId.current = selected?.id ?? null;

  const focusRetryCompletion = (target: "conversations" | "target-conversation" | "messages" | "read" | "refresh", loading: boolean, failed: boolean, panel: HTMLElement | null) => {
    const pending = retryFocus.current;
    if (!pending || pending.target !== target || loading) return;
    retryFocus.current = null;
    const active = document.activeElement;
    if (active !== pending.origin && active !== document.body) return;
    if (failed) panel?.querySelector<HTMLButtonElement>("[data-retry-button]:not(:disabled)")?.focus();
    else panel?.querySelector<HTMLElement>("h2")?.focus();
  };

  useEffect(() => {
    focusRetryCompletion("conversations", conversationsLoading, conversationsError, conversationsPanel.current);
  }, [conversationsLoading, conversationsError]);

  useEffect(() => {
    focusRetryCompletion("target-conversation", targetConversationLoading, targetConversationError, messagePanel.current);
  }, [targetConversationLoading, targetConversationError]);

  useEffect(() => {
    focusRetryCompletion("messages", messagesLoading, messagesError, messagePanel.current);
  }, [messagesLoading, messagesError]);

  useEffect(() => {
    focusRetryCompletion("read", readRetrying, readError, messagePanel.current);
  }, [readRetrying, readError]);

  useEffect(() => {
    if (sending) return;
    const pending = sendFocus.current;
    if (!pending) return;
    sendFocus.current = null;
    if (selected?.id !== pending.conversationId) return;
    const active = document.activeElement;
    if (active !== pending.origin && active !== document.body) return;
    if (sendError) {
      if (pending.composerOrigin) {
        messagePanel.current?.querySelector<HTMLInputElement>("form input")?.focus();
      } else {
        messagePanel.current?.querySelector<HTMLButtonElement>("[data-retry-button]:not(:disabled)")?.focus();
      }
      return;
    }
    messagePanel.current?.querySelector<HTMLInputElement>("form input")?.focus();
  }, [sending, sendError, selected?.id]);

  useEffect(() => {
    sendRequest.current += 1;
    readRequest.current += 1;
    setSending(false);
    setReadRetrying(false);
    setSelected(null);
    setConversations(null);
    setMessages(null);
    setBody("");
    setSendError(false);
    setReadError(false);
    sendFocus.current = null;
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setConversationsLoading(true);
    setConversationsError(false);
    getConversations(conversationPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(conversationPage, data.totalPages)) {
          setConversationPage(getLastPageIndex(data.totalPages));
          return;
        }
        setConversations(data);
      })
      .catch(() => { if (current) setConversationsError(true); })
      .finally(() => { if (current) setConversationsLoading(false); });
    return () => { current = false; };
  }, [isAuth, conversationPage, conversationRevision, user?.id]);

  useEffect(() => {
    if (!isAuth || !validTargetUserId || targetUserId === user?.id) {
      sendRequest.current += 1;
      readRequest.current += 1;
      setTargetConversationLoading(false);
      setTargetConversationError(false);
      return;
    }
    const requestId = ++targetConversationRequest.current;
    sendRequest.current += 1;
    readRequest.current += 1;
    let current = true;
    setSelected(null);
    setTargetConversationLoading(true);
    setTargetConversationError(false);
    startConversation(targetUserId)
      .then(({ data }) => {
        if (!current || targetConversationRequest.current !== requestId) return;
        setSelected(data);
        setMessagePage(0);
        setConversationPage(0);
        setConversationRevision(value => value + 1);
        setSearchParams({}, { replace: true });
      })
      .catch(() => { if (current && targetConversationRequest.current === requestId) setTargetConversationError(true); })
      .finally(() => { if (current && targetConversationRequest.current === requestId) setTargetConversationLoading(false); });
    return () => {
      current = false;
      if (targetConversationRequest.current === requestId) targetConversationRequest.current += 1;
    };
  }, [isAuth, setSearchParams, targetConversationAttempt, targetUserId, user?.id, validTargetUserId]);

  useEffect(() => {
    const readGeneration = ++readRequest.current;
    const requestUserId = activeUserId.current;
    const conversationId = selected?.id ?? null;
    const isCurrentRead = () => conversationId !== null
      && requestUserId !== null
      && activeUserId.current === requestUserId
      && activeConversationId.current === conversationId
      && readRequest.current === readGeneration;
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
        if (isPageOutOfRange(messagePage, data.totalPages)) {
          setMessagePage(getLastPageIndex(data.totalPages));
          return;
        }
        scrollToLatest.current = messagePage === 0;
        setMessages(data);
        if (isCurrentRead()) {
          void markConversationRead(selected.id)
            .then(() => { if (isCurrentRead()) notifyUnreadCountsChanged("messages"); })
            .catch(() => { if (isCurrentRead()) setReadError(true); });
        }
      })
      .catch(() => { if (current) setMessagesError(true); })
      .finally(() => { if (current) setMessagesLoading(false); });
    return () => { current = false; };
  }, [messagePage, messageRevision, selected, user?.id]);

  const updates = useMessageUpdates({
    userId: ready && isAuth ? user?.id ?? null : null,
    conversationId: selected?.id ?? null,
    conversationPage,
    messagePage,
    latestMessageId: messages && messagePage === 0 ? messages.content[0]?.id ?? 0 : null,
    paused: conversationsLoading || conversationsError || targetConversationLoading || messagesLoading || messagesError || sending || readRetrying,
    readRequest,
    onConversations: data => {
      if (isPageOutOfRange(conversationPage, data.totalPages)) setConversationPage(getLastPageIndex(data.totalPages));
      else setConversations(data);
    },
    onMessages: data => {
      const log = messagePanel.current?.querySelector<HTMLElement>("[role=log]");
      scrollToLatest.current = !log || log.scrollHeight - log.scrollTop - log.clientHeight < 32;
      setMessages(data);
    },
    onConversationsUnavailable: () => { setConversations(null); setConversationsError(true); },
    onMessagesUnavailable: () => { setMessages(null); setMessagesError(true); },
    onReadError: setReadError,
  });
  useEffect(() => {
    focusRetryCompletion("refresh", updates.refreshing, updates.error, selected ? messagePanel.current : conversationsPanel.current);
  }, [updates.error, updates.refreshing, selected]);

  if (!ready) return <main className={styles.page} aria-labelledby="messages-title" aria-busy={!ready}><div className={styles.shell}><h1 id="messages-title" className="srOnly">{t("messages")}</h1><p className={styles.notice} role="status">{t("loading")}</p></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }} replace />;

  const chooseConversation = (conversation: Conversation) => {
    targetConversationRequest.current += 1;
    sendRequest.current += 1;
    readRequest.current += 1;
    setSending(false);
    setReadRetrying(false);
    setSendError(false);
    sendFocus.current = null;
    setReadError(false);
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
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sendFocus.current = { conversationId: selected.id, origin, composerOrigin: origin instanceof HTMLInputElement };
    const requestId = ++sendRequest.current;
    const requestUserId = activeUserId.current;
    const conversationId = selected.id;
    const isCurrentSend = () => requestUserId !== null
      && activeUserId.current === requestUserId
      && activeConversationId.current === conversationId
      && sendRequest.current === requestId;
    setSending(true);
    setSendError(false);
    try {
      await sendMessage(conversationId, body.trim());
      if (!isCurrentSend()) return;
      setBody("");
      setMessagePage(0);
      setMessageRevision(value => value + 1);
      setConversationPage(0);
      setConversationRevision(value => value + 1);
    } catch {
      if (isCurrentSend()) setSendError(true);
    } finally {
      if (isCurrentSend()) setSending(false);
    }
  };

  const retryMarkRead = async () => {
    if (!selected || readRetrying) return;
    const requestId = ++readRequest.current;
    const requestUserId = activeUserId.current;
    const conversationId = selected.id;
    const isCurrentRead = () => requestUserId !== null
      && activeUserId.current === requestUserId
      && activeConversationId.current === conversationId
      && readRequest.current === requestId;
    setReadRetrying(true);
    setReadError(false);
    try {
      await markConversationRead(conversationId);
      if (isCurrentRead()) notifyUnreadCountsChanged("messages");
    } catch {
      if (isCurrentRead()) setReadError(true);
    } finally {
      if (isCurrentRead()) setReadRetrying(false);
    }
  };

  const pageBusy = conversationsLoading || targetConversationLoading || messagesLoading || readRetrying || sending;

  return <main className={styles.page} aria-labelledby="messages-title" aria-busy={pageBusy}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("socialEyebrow")}</p>
        <h1 id="messages-title">{t("messages")}</h1>
        <p>{t("messagesIntro")}</p>
      </section>
      <div className={styles.layout}>
        <aside ref={conversationsPanel} className={styles.panel} aria-label={t("conversations")} aria-busy={conversationsLoading}>
          <h2 tabIndex={-1}>{t("conversations")}</h2>
          {conversationsLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
          {conversationsError && <RetryNotice className={styles.error} message={t("loadConversationsError")} retryLabel={t("retry")} onRetry={() => { retryFocus.current = { target: "conversations", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null }; setConversationsLoading(true); setConversationsError(false); setConversationRevision(value => value + 1); }} />}
          {!conversationsLoading && !conversationsError && conversations?.content.length === 0 && <p className={styles.empty}>{t("noConversations")}</p>}
          {!conversationsLoading && !conversationsError && conversations && conversations.content.length > 0 && <ul className={styles.conversationList}>
            {conversations.content.map(item => {
              const name = getUserIdentity(item.otherUser, t("someone"));
              return <li key={item.id}><button className={`${styles.conversationButton} ${selected?.id === item.id ? styles.conversationButtonSelected : ""}`} type="button" disabled={sending} onClick={() => chooseConversation(item)} aria-pressed={selected?.id === item.id}><strong>{name}</strong>{item.lastMessage && <small>{editorialText(item.lastMessage.body, t("emptyMessageBody"))}</small>}</button></li>;
            })}
          </ul>}
          {conversations && <Pagination className={styles.pagination} page={conversationPage} totalPages={conversations.totalPages} label={t("conversationsPagination")} busy={conversationsLoading || sending} onPageChange={setConversationPage} />}
        </aside>
        <section ref={messagePanel} className={styles.panel} aria-labelledby={selected ? "conversation-title" : undefined} aria-label={selected ? undefined : t("messages")} aria-busy={messagesLoading || targetConversationLoading || sending}>
          {updates.error && <RetryNotice className={styles.error} message={t("refreshMessagesError")} retryLabel={t("retry")}
            disabled={updates.refreshing} busy={updates.refreshing} onRetry={() => {
              retryFocus.current = { target: "refresh", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
              updates.refresh();
            }} />}
          {!selected && targetConversationLoading && <div className={styles.panelState}><p className={styles.notice} role="status">{t("loading")}</p></div>}
          {!selected && targetConversationError && <div className={styles.panelState}><RetryNotice className={styles.error} message={t("startConversationError")} retryLabel={t("retry")} onRetry={() => { retryFocus.current = { target: "target-conversation", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null }; setTargetConversationLoading(true); setTargetConversationError(false); setTargetConversationAttempt(value => value + 1); }} /></div>}
          {!selected && !targetConversationLoading && !targetConversationError && <div className={styles.panelState}><p className={styles.empty}>{t("chooseConversation")}</p></div>}
          {selected && <>
            <h2 className={styles.conversationTitle} id="conversation-title" tabIndex={-1}><Link to={path(`/users/${selected.otherUser.id}`)}>{getUserIdentity(selected.otherUser, t("someone"))}</Link></h2>
            {messagesLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
            {messagesError && <RetryNotice className={styles.error} message={t("loadMessagesError")} retryLabel={t("retry")} onRetry={() => { retryFocus.current = { target: "messages", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null }; setMessagesLoading(true); setMessagesError(false); setMessageRevision(value => value + 1); }} />}
            {readError && <RetryNotice className={styles.error} message={t("markMessagesReadError")} retryLabel={readRetrying ? t("loading") : t("retry")} disabled={readRetrying} busy={readRetrying} onRetry={() => { retryFocus.current = { target: "read", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null }; void retryMarkRead(); }} />}
            {!messagesLoading && !messagesError && messages?.content.length === 0 && <p className={styles.empty}>{t("noMessages")}</p>}
            {!messagesLoading && !messagesError && messages && messages.content.length > 0 && <ul className={styles.messageList} role="log" aria-label={t("messages")} aria-live="polite" aria-relevant="additions">
              {[...messages.content].reverse().map(item => <li className={`${styles.messageBubble} ${item.senderId === user?.id ? styles.messageBubbleOwn : ""}`} key={item.id}><div>{editorialText(item.body, t("emptyMessageBody"))}</div><small>{formatDateTime(item.createdAt, lang)}</small></li>)}
            </ul>}
            {updates.hasNewMessages && <button className={styles.newMessages} type="button" onClick={() => {
              retryFocus.current = { target: "messages", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
              setMessagesLoading(true);
              setMessagePage(0);
            }}>{t("newMessagesAvailable")}</button>}
            {messages && <Pagination className={styles.pagination} page={messagePage} totalPages={messages.totalPages} label={t("messagesPagination")} busy={messagesLoading || sending} previousLabel={t("newerMessages")} nextLabel={t("olderMessages")} onPageChange={setMessagePage} />}
            <form className={styles.composer} onSubmit={submit} aria-busy={sending}>
              {sendError && <RetryNotice className={styles.error} message={t("sendMessageError")} retryLabel={t("retry")} disabled={sending || !body.trim()} busy={sending} onRetry={() => void sendCurrentMessage()} />}
              <input aria-label={t("messageText")} value={body} maxLength={2000} readOnly={sending} onChange={event => { setBody(event.target.value); setSendError(false); }} placeholder={t("messageText")} />
              <button type="submit" aria-busy={sending} disabled={!body.trim() || sending}>{sending ? t("loading") : t("sendMessage")}</button>
            </form>
          </>}
        </section>
      </div>
    </div>
  </main>;
}
