import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getDirectConversations,
  getDirectMessages,
  sendDirectMessage,
  startDirectConversation,
  type DirectConversation,
} from '../../api/community';
import { getOwnerBooking, type OwnerBookingRecord } from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/ToastRegion';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';
import { formatMessageTime, toChatMessage, type ChatMessage } from '../messages/messageModels';
import { OwnerShell } from './components/OwnerShell';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const bookingTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

export const OwnerMessages = () => {
  const { token } = useAuth();
  const notify = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatWithUserId = searchParams.get('chatWithUserId');
  const bookingId = Number(searchParams.get('bookingId')) || null;
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(() => !chatWithUserId);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, ChatMessage[]>>({});
  const [booking, setBooking] = useState<OwnerBookingRecord | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((item) => item.conversationId === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];
  useEffect(() => {
    if (chatWithUserId) setIsMobileListOpen(false);
  }, [chatWithUserId]);

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');
    if (!keyword) return conversations;
    return conversations.filter((item) => item.otherUsername.toLocaleLowerCase('vi-VN').includes(keyword));
  }, [conversations, search]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        let directConversations = await getDirectConversations(token);
        const targetUserId = Number(chatWithUserId);
        let target = Number.isFinite(targetUserId) && targetUserId > 0
          ? directConversations.find((item) => item.otherUserId === targetUserId)
          : undefined;

        if (!target && Number.isFinite(targetUserId) && targetUserId > 0) {
          target = await startDirectConversation(token, targetUserId);
          directConversations = [target, ...directConversations];
        }
        if (cancelled) return;

        setConversations(directConversations);
        setActiveConversationId((current) => {
          if (target) return target.conversationId;
          if (current && directConversations.some((item) => item.conversationId === current)) return current;
          return directConversations[0]?.conversationId ?? null;
        });

        if (chatWithUserId) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('chatWithUserId');
          setSearchParams(nextParams, { replace: true });
        }
      } catch (error) {
        if (!cancelled) notify(error instanceof Error ? error.message : 'Không thể tải hội thoại khách hàng.', 'error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [token, chatWithUserId]);

  useEffect(() => {
    if (!token || !bookingId) {
      setBooking(null);
      return;
    }
    let cancelled = false;
    getOwnerBooking(token, bookingId)
      .then((result) => { if (!cancelled) setBooking(result); })
      .catch(() => { if (!cancelled) setBooking(null); });
    return () => { cancelled = true; };
  }, [token, bookingId]);

  const loadMessages = useCallback(async (showLoading = false) => {
    if (!token || !activeConversationId) return;
    if (showLoading) setIsMessagesLoading(true);
    try {
      const result = await getDirectMessages(token, activeConversationId, undefined, 50);
      setMessagesByConversation((current) => ({
        ...current,
        [activeConversationId]: result.map(toChatMessage),
      }));
      setConversations((current) => current.map((item) => item.conversationId === activeConversationId
        ? { ...item, unreadMessageCount: 0 }
        : item));
    } catch (error) {
      if (showLoading) notify(error instanceof Error ? error.message : 'Không thể tải tin nhắn.', 'error');
    } finally {
      if (showLoading) setIsMessagesLoading(false);
    }
  }, [token, activeConversationId, notify]);

  useEffect(() => {
    void loadMessages(true);
  }, [loadMessages]);

  useVisiblePolling(() => loadMessages(false), 4_000, Boolean(token && activeConversationId));

  useVisiblePolling(async () => {
    if (!token) return;
    try {
      setConversations(await getDirectConversations(token));
    } catch {
      // Keep the current list while the next visible poll retries.
    }
  }, 4_000, Boolean(token));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversationId, activeMessages.length]);

  const chooseConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    setIsMobileListOpen(false);
    setBooking(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('bookingId');
    nextParams.delete('chatWithUserId');
    setSearchParams(nextParams, { replace: true });
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!token || !activeConversationId || !content || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendDirectMessage(token, activeConversationId, content);
      const mapped = toChatMessage(sent);
      setMessagesByConversation((current) => ({
        ...current,
        [activeConversationId]: [
          ...(current[activeConversationId] ?? []).filter((item) => item.id !== mapped.id),
          mapped,
        ],
      }));
      setConversations((current) => current.map((item) => item.conversationId === activeConversationId
        ? { ...item, lastMessage: content, lastMessageAt: sent.sentAt }
        : item));
      setDraft('');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể gửi tin nhắn.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <OwnerShell activeId="messages" contentClassName="owner-messages-content" innerClassName="owner-messages-inner max-w-[1500px]">
      <section className="owner-page-header owner-messages-header">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="owner-kicker"><MessageCircle className="h-4 w-4" /> Chăm sóc khách hàng</p>
            <h1 className="!mt-0">Tin nhắn khách hàng</h1>
          </div>
          <p className="sr-only">Trao đổi riêng với người đặt sân, xử lý thay đổi lịch và thông báo trước khi hủy booking.</p>
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 text-[12px] font-bold sm:h-9" onClick={() => void loadMessages(true)} type="button">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </button>
      </section>

      <section className="owner-panel grid h-[calc(100dvh-13rem)] min-h-[30rem] overflow-hidden lg:h-full lg:min-h-0 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className={`${isMobileListOpen ? 'flex' : 'hidden'} min-h-0 flex-col border-b border-outline-variant bg-[#f7faf5] lg:flex lg:border-b-0 lg:border-r`}>
          <div className="border-b border-outline-variant p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold">Hội thoại</h2>
                <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">{conversations.length} khách hàng</p>
              </div>
              <span className="rounded-full bg-[#e2ff57] px-2.5 py-1 text-[10px] font-black text-[#102414]">OWNER</span>
            </div>
            <label className="mt-2 flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-1.5">
              <Search className="h-4 w-4 text-on-surface-variant" />
              <input aria-label="Tìm khách hàng" className="owner-messages-search h-7 min-h-0 min-w-0 flex-1 bg-transparent text-[13px] outline-none" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên khách..." value={search} />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoading && <p className="flex items-center justify-center gap-2 p-8 text-[12px] font-bold text-on-surface-variant"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải hội thoại...</p>}
            {!isLoading && filteredConversations.map((conversation) => {
              const active = conversation.conversationId === activeConversationId;
              const unread = !active && conversation.unreadMessageCount > 0;
              return (
                <button
                  aria-label={`${conversation.otherUsername}${unread ? `, ${conversation.unreadMessageCount} tin chưa đọc` : ''}`}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? 'bg-[#102b2e] text-white shadow-sm' : unread ? 'bg-[#eef8e6] ring-1 ring-[#cfe5c4]' : 'hover:bg-white'}`}
                  key={conversation.conversationId}
                  onClick={() => chooseConversation(conversation.conversationId)}
                  type="button"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-black ${active ? 'bg-[#e2ff57] text-[#102414]' : 'bg-[#e4eee0] text-[#276b3f]'}`}>
                    {conversation.otherProfileImageUrl
                      ? <img alt="" className="h-full w-full object-cover" src={conversation.otherProfileImageUrl} />
                      : initials(conversation.otherUsername)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className={`truncate text-[13px] ${unread ? 'font-black text-[#102b2e]' : ''}`}>{conversation.otherUsername}</strong>
                      <span className={`shrink-0 text-[9px] font-bold ${active ? 'text-white/60' : 'text-on-surface-variant'}`}>{formatMessageTime(conversation.lastMessageAt)}</span>
                    </span>
                    <span className={`mt-1 block truncate text-[11px] ${active ? 'text-white/70' : unread ? 'font-extrabold text-[#274c35]' : 'text-on-surface-variant'}`}>{conversation.lastMessage || 'Chưa có tin nhắn'}</span>
                  </span>
                  {unread && <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#e2ff57] px-1.5 text-[10px] font-black text-[#102414]">{Math.min(conversation.unreadMessageCount, 99)}</span>}
                  <ChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-[#e2ff57]' : 'text-on-surface-variant'}`} />
                </button>
              );
            })}
            {!isLoading && !filteredConversations.length && (
              <div className="p-8 text-center text-on-surface-variant">
                <UserRound className="mx-auto h-7 w-7" />
                <p className="mt-3 text-[12px] font-bold">Chưa có hội thoại khách hàng.</p>
                <p className="mt-1 text-[11px]">Mở một booking và chọn “Liên hệ khách hàng”.</p>
              </div>
            )}
          </div>
        </aside>

        <div className={`${isMobileListOpen ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-col bg-white lg:flex`}>
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf5e9] text-[#276b3f]"><MessageCircle className="h-8 w-8" /></span>
              <h2 className="mt-4 text-[18px] font-extrabold text-[#102b2e]">Chọn khách hàng để bắt đầu</h2>
              <p className="mt-2 max-w-sm text-[12px]">Hội thoại của Owner được tách riêng, không hiển thị nhóm cộng đồng hay chức năng của Player.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b border-outline-variant px-3 py-2.5 sm:gap-3 sm:px-5">
                <button
                  aria-label="Quay lại danh sách hội thoại"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-low lg:hidden"
                  onClick={() => setIsMobileListOpen(true)}
                  type="button"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e4eee0] font-black text-[#276b3f]">
                  {activeConversation.otherProfileImageUrl
                    ? <img alt="" className="h-full w-full object-cover" src={activeConversation.otherProfileImageUrl} />
                    : initials(activeConversation.otherUsername)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[15px] font-extrabold">{activeConversation.otherUsername}</h2>
                  <p className="mt-0.5 text-[10px] font-bold text-[#477313]">Khách hàng · Hội thoại trực tiếp</p>
                </div>
              </header>

              {booking && (
                <div className="border-b border-outline-variant bg-[#f2f8ee] px-4 py-2 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 items-center gap-2 text-[12px] text-[#477313]"><WalletCards className="h-4 w-4 shrink-0" /><span className="shrink-0 text-[9px] font-black uppercase tracking-wide">Booking</span><strong className="truncate text-[#102b2e]">{booking.bookingCode} · {booking.venueName} · Sân {booking.courtNumber}</strong></p>

                      <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] font-semibold text-on-surface-variant">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {bookingTime(booking.startTime)}</span>
                        <span>{money.format(booking.totalAmount)}</span>
                        <span>{booking.bookingStatus}</span>
                      </p>
                    </div>
                    <Link className="inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-white px-2.5 text-[11px] font-bold text-primary" to={`/owner/bookings/${booking.bookingId}`}>Xem đơn <ChevronRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fbf6] p-3 sm:p-4">
                {isMessagesLoading && <p className="flex items-center justify-center gap-2 p-8 text-[12px] font-bold text-on-surface-variant"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải tin nhắn...</p>}
                {!isMessagesLoading && !activeMessages.length && (
                  <div className="mx-auto mt-16 max-w-sm text-center text-on-surface-variant">
                    <MessageCircle className="mx-auto h-8 w-8" />
                    <p className="mt-3 text-[13px] font-bold text-[#102b2e]">Chưa có tin nhắn</p>
                    <p className="mt-1 text-[11px]">Gửi thông báo về booking hoặc trao đổi với khách trước khi thay đổi lịch.</p>
                  </div>
                )}
                <div className="space-y-3">
                  {activeMessages.map((message) => (
                    <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`} key={message.id}>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] shadow-sm sm:max-w-[68%] ${message.mine ? 'rounded-br-md bg-[#102b2e] text-white' : 'rounded-bl-md border border-outline-variant bg-white text-[#102b2e]'}`}>
                        {message.mediaUrl && <img alt="Tệp hình ảnh trong tin nhắn" className="mb-2 max-h-72 rounded-xl object-cover" src={message.mediaUrl} />}
                        <p className="whitespace-pre-wrap break-words leading-5">{message.text}</p>
                        <p className={`mt-1 text-right text-[9px] font-bold ${message.mine ? 'text-white/55' : 'text-on-surface-variant'}`}>{message.time}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form className="border-t border-outline-variant bg-white px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:p-3" onSubmit={sendMessage}>
                <div className="flex items-end gap-2 rounded-xl border border-outline-variant bg-[#f8fbf6] p-2 focus-within:border-[#98d951] focus-within:ring-2 focus-within:ring-[#e2ff57]/40">
                  <textarea
                    aria-label="Nội dung tin nhắn"
                    className="max-h-20 min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] outline-none"
                    disabled={isSending}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Nhập tin nhắn cho khách hàng..."
                    rows={1}
                    value={draft}
                  />
                  <button aria-label="Gửi tin nhắn" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={!draft.trim() || isSending} type="submit">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="sr-only">Enter để gửi · Shift + Enter để xuống dòng</p>
              </form>
            </>
          )}
        </div>
      </section>
    </OwnerShell>
  );
};