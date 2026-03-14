'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  CreditCard,
  Banknote,
  Users,
  Home,
  MapPin,
  Check,
  X,
  Star,
} from 'lucide-react';
import { bookingsAPI, paymentsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  formatPrice,
  formatDate,
  formatShortDate,
} from '@gites/shared';
import type {
  BookingSummary,
  BookingStatus,
  PaymentStatus,
  PaymentSummary,
  SplitPaymentSummary,
} from '@gites/shared';

function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    PENDING: 'En attente de confirmation',
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

function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    PENDING: 'À payer',
    PAID: 'Payé',
    OVERDUE: 'En retard',
    REFUNDED: 'Remboursé',
  };
  return labels[status] || status;
}

function getPaymentStatusClass(status: PaymentStatus): string {
  switch (status) {
    case 'PAID':
      return 'badge bg-green-100 text-green-800';
    case 'PENDING':
      return 'badge bg-yellow-100 text-yellow-800';
    case 'OVERDUE':
      return 'badge bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'badge bg-gray-100 text-gray-600';
    default:
      return 'badge bg-gray-100 text-gray-800';
  }
}

function PaymentWeekRow({
  payment,
  isOwner,
  bookingId,
  bookingMethod,
  onCashConfirm,
}: {
  payment: PaymentSummary;
  isOwner: boolean;
  bookingId: string;
  bookingMethod: string;
  onCashConfirm: (weekNumber: number) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onCashConfirm(payment.weekNumber);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
            payment.status === 'PAID'
              ? 'bg-green-100 text-green-700'
              : payment.status === 'OVERDUE'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {payment.weekNumber}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">
            Semaine {payment.weekNumber} — {formatPrice(payment.amount)}
          </p>
          <p className="text-xs text-gray-500">
            Échéance : {formatShortDate(payment.dueDate)}
            {payment.paidAt && (
              <span className="ml-2 text-green-600">
                · Payé le {formatShortDate(payment.paidAt)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={getPaymentStatusClass(payment.status)}>
          {getPaymentStatusLabel(payment.status)}
        </span>
        {isOwner &&
          bookingMethod === 'CASH' &&
          payment.status === 'PENDING' && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <Check size={14} />
              {confirming ? 'Confirmation...' : `Confirmer réception semaine ${payment.weekNumber}`}
            </button>
          )}
      </div>
    </div>
  );
}

function SplitPaymentRow({ split }: { split: SplitPaymentSummary }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">
          Semaine {split.weekNumber} — {split.payerName || split.payerEmail || 'Invité en attente'}
        </p>
        {split.payerEmail && (
          <p className="text-xs text-gray-500">{split.payerEmail}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-800">{formatPrice(split.amount)}</span>
        <span
          className={`badge ${
            split.isPaid
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {split.isPaid ? 'Payé' : 'En attente'}
        </span>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    loadBooking();
  }, [id, isAuthenticated, token]);

  async function loadBooking() {
    if (!token) return;
    setLoading(true);
    try {
      const { booking: data } = await bookingsAPI.getById(token, id as string) as { booking: BookingSummary };
      setBooking(data);
    } catch (error: any) {
      toast.error('Réservation introuvable');
      router.push('/bookings');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking() {
    if (!token || !booking) return;
    setActionLoading('confirm');
    try {
      await bookingsAPI.confirm(token, booking.id);
      toast.success('Réservation confirmée !');
      await loadBooking();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la confirmation');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelBooking() {
    if (!token || !booking) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    setActionLoading('cancel');
    try {
      await bookingsAPI.cancel(token, booking.id);
      toast.success('Réservation annulée');
      await loadBooking();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCashConfirm(weekNumber: number) {
    if (!token || !booking) return;
    try {
      await paymentsAPI.confirmCash(token, booking.id, weekNumber);
      toast.success(`Réception de la semaine ${weekNumber} confirmée !`);
      await loadBooking();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la confirmation');
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded-card" />
        <div className="h-64 bg-gray-200 rounded-card" />
      </div>
    );
  }

  if (!booking) return null;

  const isOwner =
    user?.role === 'OWNER' || user?.role === 'ADMIN';
  const isTenant = !isOwner;
  const listing = booking.listing;
  const photo = listing.photos[0];

  const paidPayments = booking.payments.filter((p) => p.status === 'PAID').length;
  const totalPayments = booking.payments.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Fil d'ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/bookings" className="hover:text-primary flex items-center gap-1">
          <ChevronLeft size={16} />
          Mes réservations
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte logement */}
          <div className="card p-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-gray-200">
                {photo ? (
                  <Image
                    src={photo}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home className="text-gray-400" size={32} />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-heading font-bold text-gray-900">{listing.title}</h1>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={14} />
                      {listing.city} · {listing.nuclearPlant.name}
                    </p>
                  </div>
                  <span className={getStatusBadgeClass(booking.status)}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Arrivée</p>
                      <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Départ</p>
                      <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Voyageurs</p>
                      <p className="font-medium">{booking.numberOfGuests} personne{booking.numberOfGuests > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.paymentMethod === 'CASH' ? (
                      <Banknote size={15} className="text-gray-400" />
                    ) : (
                      <CreditCard size={15} className="text-gray-400" />
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Paiement</p>
                      <p className="font-medium">
                        {booking.paymentMethod === 'CARD'
                          ? 'Carte bancaire'
                          : booking.paymentMethod === 'CASH'
                          ? 'Espèces'
                          : 'Partagé'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions propriétaire */}
          {isOwner && booking.status === 'PENDING' && (
            <div className="card p-5 border-2 border-yellow-200 bg-yellow-50">
              <h2 className="font-heading font-bold text-gray-900 mb-1">Action requise</h2>
              <p className="text-sm text-gray-600 mb-4">
                Un locataire souhaite réserver votre logement. Acceptez ou refusez cette demande.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmBooking}
                  disabled={actionLoading === 'confirm'}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check size={18} />
                  {actionLoading === 'confirm' ? 'Confirmation...' : 'Accepter la réservation'}
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={actionLoading === 'cancel'}
                  className="btn-secondary flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <X size={18} />
                  Refuser
                </button>
              </div>
            </div>
          )}

          {/* Annulation locataire */}
          {isTenant &&
            (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <div className="text-right">
                <button
                  onClick={handleCancelBooking}
                  disabled={actionLoading === 'cancel'}
                  className="text-sm text-red-500 hover:text-red-700 underline"
                >
                  {actionLoading === 'cancel' ? 'Annulation...' : 'Annuler cette réservation'}
                </button>
              </div>
            )}

          {/* Échéancier de paiement */}
          {booking.payments.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-bold text-gray-900">
                  Calendrier de paiement
                </h2>
                <span className="text-sm text-gray-500">
                  {paidPayments} / {totalPayments} payée{totalPayments > 1 ? 's' : ''}
                </span>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-5">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: totalPayments > 0 ? `${Math.round((paidPayments / totalPayments) * 100)}%` : '0%',
                  }}
                />
              </div>

              <div className="divide-y divide-gray-100">
                {booking.payments.map((payment) => (
                  <PaymentWeekRow
                    key={payment.id}
                    payment={payment}
                    isOwner={isOwner}
                    bookingId={booking.id}
                    bookingMethod={booking.paymentMethod}
                    onCashConfirm={handleCashConfirm}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paiements partagés */}
          {booking.splitPayments && booking.splitPayments.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">
                Paiements partagés
              </h2>
              <div className="divide-y divide-gray-100">
                {booking.splitPayments.map((split) => (
                  <SplitPaymentRow key={split.id} split={split} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar récapitulatif */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h2 className="font-heading font-bold text-gray-900 mb-4">Récapitulatif</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Prix par semaine</span>
                <span className="font-medium">{formatPrice(booking.weeklyPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Durée</span>
                <span className="font-medium">
                  {booking.numberOfWeeks} semaine{booking.numberOfWeeks > 1 ? 's' : ''}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-heading font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>

            {/* Progression rapide */}
            {totalPayments > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Progression des paiements
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round((paidPayments / totalPayments) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {Math.round((paidPayments / totalPayments) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {paidPayments} semaine{paidPayments > 1 ? 's' : ''} payée
                  {paidPayments > 1 ? 's' : ''} sur {totalPayments}
                </p>
              </div>
            )}

            <Link
              href={`/messages?listing=${listing.id}`}
              className="btn-secondary w-full mt-5 flex items-center justify-center gap-2 text-sm"
            >
              Contacter {isOwner ? 'le locataire' : 'le propriétaire'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
