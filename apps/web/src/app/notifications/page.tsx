'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Bell,
  BellOff,
  Calendar,
  CreditCard,
  MessageSquare,
  Home,
  Star,
  CheckCheck,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BadgeCheck,
} from 'lucide-react';
import { notificationsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDate } from '@gites/shared';
import type { NotificationData, NotificationType } from '@gites/shared';

function getNotificationIcon(type: NotificationType) {
  const iconMap: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
    NEW_BOOKING: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    BOOKING_CONFIRMED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    BOOKING_CANCELLED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
    PAYMENT_REMINDER: { icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-100' },
    PAYMENT_RECEIVED: { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100' },
    PAYMENT_OVERDUE: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    NEW_MESSAGE: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
    SPLIT_INVITE: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    LISTING_VERIFIED: { icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-100' },
    LISTING_REJECTED: { icon: Home, color: 'text-red-500', bg: 'bg-red-100' },
    REVIEW_RECEIVED: { icon: Star, color: 'text-accent-dark', bg: 'bg-yellow-100' },
  };

  return iconMap[type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' };
}

function getNotificationLink(notification: NotificationData): string | null {
  const data = notification.data as any;
  switch (notification.type) {
    case 'NEW_BOOKING':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
      return data?.bookingId ? `/bookings/${data.bookingId}` : '/bookings';
    case 'PAYMENT_REMINDER':
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_OVERDUE':
      return data?.bookingId ? `/bookings/${data.bookingId}` : '/bookings';
    case 'NEW_MESSAGE':
      return '/messages';
    case 'SPLIT_INVITE':
      return data?.bookingId ? `/bookings/${data.bookingId}` : '/bookings';
    case 'LISTING_VERIFIED':
    case 'LISTING_REJECTED':
      return data?.listingId ? `/listings/${data.listingId}` : '/listings';
    case 'REVIEW_RECEIVED':
      return data?.listingId ? `/listings/${data.listingId}` : null;
    default:
      return null;
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return formatDate(dateStr);
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
}) {
  const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
  const link = getNotificationLink(notification);

  const content = (
    <div
      className={`flex items-start gap-4 p-4 rounded-card transition-colors cursor-pointer ${
        notification.isRead
          ? 'bg-white hover:bg-gray-50'
          : 'bg-primary/5 border border-primary/10 hover:bg-primary/10'
      }`}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      {/* Icône */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={20} className={color} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
            {notification.title}
          </p>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notification.body}</p>
      </div>

      {/* Indicateur non lu */}
      {!notification.isRead && (
        <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    loadNotifications();
  }, [isAuthenticated, token]);

  async function loadNotifications() {
    if (!token) return;
    setLoading(true);
    try {
      const { notifications: notifs, unreadCount: count } =
        await notificationsAPI.getAll(token) as { notifications: NotificationData[]; unreadCount: number };
      setNotifications(notifs);
      setUnreadCount(count);
    } catch {
      toast.error('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    if (!token) return;
    try {
      await notificationsAPI.markRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silencieux
    }
  }

  async function handleMarkAllRead() {
    if (!token || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications marquées comme lues');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setMarkingAll(false);
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  // Grouper par date
  function groupByDate(notifs: NotificationData[]): Record<string, NotificationData[]> {
    const groups: Record<string, NotificationData[]> = {};
    notifs.forEach((n) => {
      const date = new Date(n.createdAt);
      const now = new Date();
      let key: string;

      const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) key = "Aujourd'hui";
      else if (diffDays === 1) key = 'Hier';
      else if (diffDays < 7) key = 'Cette semaine';
      else key = 'Plus ancien';

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  }

  const grouped = groupByDate(filteredNotifications);
  const groupOrder = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien'];

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
          >
            <CheckCheck size={16} />
            {markingAll ? 'Mise à jour...' : 'Tout marquer comme lu'}
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Toutes
          {notifications.length > 0 && (
            <span className="ml-2 opacity-70">{notifications.length}</span>
          )}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Non lues
          {unreadCount > 0 && (
            <span className="ml-2 opacity-70">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-card animate-pulse">
              <div className="w-11 h-11 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20">
          {filter === 'unread' ? (
            <>
              <CheckCheck className="mx-auto text-green-300 mb-4" size={64} />
              <h2 className="text-xl font-heading font-bold text-gray-500">
                Tout est lu !
              </h2>
              <p className="text-gray-400 mt-2">Vous n'avez aucune notification non lue.</p>
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-primary hover:underline text-sm"
              >
                Voir toutes les notifications
              </button>
            </>
          ) : (
            <>
              <BellOff className="mx-auto text-gray-300 mb-4" size={64} />
              <h2 className="text-xl font-heading font-bold text-gray-500">
                Aucune notification
              </h2>
              <p className="text-gray-400 mt-2">
                Vous serez notifié lors de vos réservations, messages et paiements.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder
            .filter((key) => grouped[key]?.length > 0)
            .map((groupKey) => (
              <div key={groupKey}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {groupKey}
                </h2>
                <div className="space-y-2">
                  {grouped[groupKey].map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
