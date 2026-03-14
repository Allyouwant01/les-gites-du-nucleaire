'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Send,
  MessageSquare,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { messagesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDate } from '@gites/shared';
import type { ConversationSummary, MessageData } from '@gites/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  const initials = `${conv.otherUser.firstName[0]}${conv.otherUser.lastName[0]}`;
  const hasUnread = conv.lastMessage && !conv.lastMessage.isRead;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
        isActive ? 'bg-primary/5 border-r-2 border-primary' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conv.otherUser.avatarUrl ? (
          <Image
            src={conv.otherUser.avatarUrl}
            alt={`${conv.otherUser.firstName} ${conv.otherUser.lastName}`}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        )}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
            {conv.otherUser.firstName} {conv.otherUser.lastName}
          </p>
          {conv.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatMessageTime(conv.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {conv.lastMessage && (
          <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
            {conv.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: MessageData;
  isMine: boolean;
}) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm ${
          isMine
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isMine ? 'text-primary-light/70' : 'text-gray-400'}`}>
            {formatMessageTime(message.createdAt)}
          </span>
          {isMine && (
            message.readAt ? (
              <CheckCheck size={12} className="text-accent" />
            ) : (
              <Check size={12} className="text-primary-light/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isAuthenticated } = useAuthStore();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showConvListMobile, setShowConvListMobile] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    loadConversations();
    connectSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, token]);

  function connectSocket() {
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connecté');
    });

    socket.on('new_message', (message: MessageData) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Mettre à jour la conversation
      setConversations((prev) =>
        prev.map((conv) => {
          const isRelevant =
            conv.otherUser.id === message.senderId ||
            conv.otherUser.id === message.receiverId;
          if (!isRelevant) return conv;
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              isRead: false,
            },
          };
        })
      );
      scrollToBottom();
    });

    socket.on('typing', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(Array.from(prev).concat(userId)));
    });

    socket.on('stop_typing', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on('message_read', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, readAt: new Date().toISOString() } : m
        )
      );
    });

    socketRef.current = socket;
  }

  async function loadConversations() {
    if (!token) return;
    setLoading(true);
    try {
      const { conversations: convs } = await messagesAPI.getConversations(token) as { conversations: ConversationSummary[] };
      setConversations(convs);

      // Si paramètre 'to' dans l'URL, ouvrir cette conversation
      const toUserId = searchParams.get('to');
      if (toUserId) {
        const found = convs.find((c) => c.otherUser.id === toUserId);
        if (found) {
          openConversation(found.id);
        }
      }
    } catch (error) {
      toast.error('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(convId: string) {
    setActiveConvId(convId);
    setShowConvListMobile(false);
    setMessagesLoading(true);
    setMessages([]);

    try {
      const { messages: msgs } = await messagesAPI.getMessages(token!, convId) as { messages: MessageData[]; pagination: any };
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);

      // Rejoindre la room socket
      socketRef.current?.emit('join_conversation', convId);
    } catch (error) {
      toast.error('Impossible de charger les messages');
    } finally {
      setMessagesLoading(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleTyping() {
    if (!activeConvId) return;
    socketRef.current?.emit('typing', { conversationId: activeConvId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { conversationId: activeConvId });
    }, 2000);
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newMessage.trim() || !activeConvId || sending || !token) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const activeConv = conversations.find((c) => c.id === activeConvId);
    if (!activeConv) { setSending(false); return; }

    try {
      const result = await messagesAPI.send(token, {
        receiverId: activeConv.otherUser.id,
        content,
        conversationId: activeConvId,
      }) as { message: MessageData };

      setMessages((prev) => {
        if (prev.find((m) => m.id === result.message.id)) return prev;
        return [...prev, result.message];
      });
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConvId
            ? {
                ...conv,
                lastMessage: {
                  content,
                  createdAt: result.message.createdAt,
                  isRead: true,
                },
              }
            : conv
        )
      );
      setTimeout(scrollToBottom, 50);
    } catch (error: any) {
      toast.error('Impossible d\'envoyer le message');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-4 sm:px-6 lg:px-8 py-0 sm:py-6">
      <div className="bg-white rounded-none sm:rounded-card shadow-card overflow-hidden flex h-[calc(100vh-8rem)]">
        {/* Liste des conversations */}
        <div
          className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-200 flex flex-col ${
            !showConvListMobile ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-lg font-heading font-bold text-gray-900">Messages</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                    <div className="w-11 h-11 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm text-gray-500">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  onClick={() => openConversation(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Zone de messagerie */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            showConvListMobile ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Header de la conversation */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
                <button
                  onClick={() => setShowConvListMobile(true)}
                  className="sm:hidden p-1.5 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {activeConv.otherUser.firstName[0]}{activeConv.otherUser.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {activeConv.otherUser.firstName} {activeConv.otherUser.lastName}
                  </p>
                  {typingUsers.size > 0 && (
                    <p className="text-xs text-primary animate-pulse">En train d&apos;écrire…</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="text-primary animate-spin" size={32} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Commencez la conversation
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMine={msg.senderId === user?.id}
                      />
                    ))}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start mb-2">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Zone de saisie */}
              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrivez un message… (Entrée pour envoyer)"
                    rows={1}
                    className="flex-1 resize-none input-field py-2.5 max-h-32 overflow-y-auto"
                    style={{ minHeight: '44px' }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary w-11 h-11 p-0 flex items-center justify-center flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MessageSquare className="text-gray-200 mb-4" size={64} />
              <h2 className="text-xl font-heading font-bold text-gray-500 mb-2">
                Vos messages
              </h2>
              <p className="text-gray-400 text-sm max-w-xs">
                Sélectionnez une conversation pour afficher les messages, ou contactez un
                propriétaire depuis une annonce.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
