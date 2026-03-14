'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Home,
  CreditCard,
  Banknote,
  Users,
} from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatPrice, formatDate } from '@gites/shared';
import type { BookingSummary, BookingStatus, PaymentStatus } from '@gites/shared';
import toast from 'react-hot-toast';

function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    ACTIVE: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'badge bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'badge bg-blue-100 text-blue-800';
    case 'ACTIVE':
      return 'badge bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'badge bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'badge bg-red-100 text-red-800';
    default:
      return 'badge bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return <Clock size={14} className="text-yellow-600" />;
    case 'CONFIRMED':
      return <CheckCircle size={14} className="text-blue-600" />;
    case 'ACTIVE':
      return <CheckCircle size={14} className="text-green-600" />;
    case 'COMPLETED':
      return <CheckCircle size={14} className="text-gray-500" />;
    case 'CANCELLED':
      return <XCircle size={14} className="text-red-500" />;
    default:
      return <AlertCircle size={14} className="text-gray-400" />;
  }
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CARD: 'Carte bancaire',
    CASH: 'Espèces',
    SPLIT: 'Paiement partagé',
  };
  return labels[method] || method;
}

function PaymentProgress({ payments }: { payments: BookingSummary['payments'] }) {
  if (!payments || payments.length === 0) return null;
  const paid = payments.filter((p) => p.status === 'PAID').length;
  const total = payments.length;
  const pct = Math.round((paid / total) * 100);

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Paiements effectués</span>
        <span>
          {paid} / {total} semaine{total > 1 ? 's' : ''}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingSummary }) {
  const photo = booking.listing.photos[0];
  return (
    <Link href={`/bookings/${booking.id}`}>
      <div className="card flex flex-col sm:flex-row cursor-pointer hover:shadow-elevated transition-shadow animate-fade-in">
        {/* Photo */}
        <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 bg-gray-200">
          {photo ? (
            <Image
              src={photo}
              alt={booking.listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="text-gray-400" size={32} />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{booking.listing.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{booking.listing.nuclearPlant.name}</p>
            </div>
            <span className={`${getStatusBadgeClass(booking.status)} flex items-center gap-1 flex-shrink-0`}>
              {getStatusIcon(booking.status)}
              {getStatusLabel(booking.status)}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
            </span>
            <span className="flex items-center gap-1.5">
              {booking.paymentMethod === 'CASH' ? (
                <Banknote size={14} />
              ) : (
                <CreditCard size={14} />
              )}
              {getPaymentMethodLabel(booking.paymentMethod)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="font-heading font-bold text-primary text-lg">
                {formatPrice(booking.weeklyPrice)}
              </span>
              <span className="text-sm text-gray-500"> / semaine</span>
              <span className="ml-2 text-sm text-gray-500">
                · {booking.numberOfWeeks} semaine{booking.numberOfWeeks > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          <PaymentProgress payments={booking.payments} />
        </div>
      </div>
    </Link>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tenant' | 'owner'>('tenant');
  const [tenantBookings, setTenantBookings] = useState<BookingSummary[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    loadBookings();
  }, [isAuthenticated, token]);

  async function loadBookings() {
    if (!token) return;
    setLoading(true);
    try {
      const tenantParams = new URLSearchParams({ role: 'tenant' });
      const { bookings: tBookings } = await bookingsAPI.getAll(token, tenantParams) as { bookings: BookingSummary[] };
      setTenantBookings(tBookings);

      if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
        const ownerParams = new URLSearchParams({ role: 'owner' });
        const { bookings: oBookings } = await bookingsAPI.getAll(token, ownerParams) as { bookings: BookingSummary[] };
        setOwnerBookings(oBookings);
      }
    } catch (error: any) {
      toast.error('Impossible de charger les réservations');
    } finally {
      setLoading(false);
    }
  }

  const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const currentBookings = activeTab === 'tenant' ? tenantBookings : ownerBookings;

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">Mes réservations</h1>

      {/* Onglets */}
      {isOwner && (
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('tenant')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'tenant'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mes réservations
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'owner'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} />
            Réservations reçues
            {ownerBookings.filter((b) => b.status === 'PENDING').length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {ownerBookings.filter((b) => b.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse flex">
              <div className="w-40 h-40 bg-gray-200 flex-shrink-0" />
              <div className="p-4 flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : currentBookings.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-heading font-bold text-gray-500">
            {activeTab === 'tenant'
              ? 'Vous n\'avez pas encore de réservation'
              : 'Aucune réservation reçue'}
          </h2>
          {activeTab === 'tenant' && (
            <p className="text-gray-400 mt-2 mb-6">
              Trouvez un logement près de votre prochaine mission
            </p>
          )}
          {activeTab === 'tenant' && (
            <Link href="/listings" className="btn-primary inline-flex items-center gap-2">
              <Home size={18} />
              Chercher un logement
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
