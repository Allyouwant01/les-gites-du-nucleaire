'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Plus, Home, Star, Calendar, Euro, Eye, Edit2, ToggleLeft, ToggleRight,
  TrendingUp, Users, CheckCircle, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { listingsAPI, bookingsAPI } from '@/lib/api';
import { formatPrice } from '@gites/shared';

interface Listing {
  id: string;
  title: string;
  city: string;
  photos: string[];
  pricePerWeek: number;
  isVerified: boolean;
  isActive: boolean;
  rating: number | null;
  reviewCount: number;
  bookingsCount: number;
  nuclearPlant: { id: string; name: string };
  createdAt: string;
}

interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  numberOfGuests: number;
  tenant: { firstName: string; lastName: string };
  listing: { title: string };
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Attendre l'hydratation de Zustand (persist charge le localStorage de manière asynchrone)
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'OWNER') {
      router.push('/');
      toast.error('Accès réservé aux propriétaires');
      return;
    }
    loadData();
  }, [hydrated, isAuthenticated, user]);

  async function loadData() {
    try {
      setLoading(true);
      const [listingsRes, bookingsRes] = await Promise.all([
        listingsAPI.getMyListings(token!),
        bookingsAPI.getAll(token!, new URLSearchParams({ role: 'owner', limit: '5' })).catch(() => ({ bookings: [] })),
      ]);
      setListings(listingsRes.listings || []);
      setRecentBookings(bookingsRes.bookings || []);
    } catch (error: any) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(listingId: string, currentActive: boolean) {
    try {
      await listingsAPI.update(token!, listingId, { isActive: !currentActive });
      setListings(prev => prev.map(l =>
        l.id === listingId ? { ...l, isActive: !currentActive } : l
      ));
      toast.success(currentActive ? 'Annonce désactivée' : 'Annonce activée');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  // Stats calculées
  const stats = {
    totalListings: listings.length,
    activeListings: listings.filter(l => l.isActive && l.isVerified).length,
    totalBookings: listings.reduce((sum, l) => sum + l.bookingsCount, 0),
    avgRating: listings.filter(l => l.rating).length > 0
      ? (listings.filter(l => l.rating).reduce((sum, l) => sum + (l.rating || 0), 0) / listings.filter(l => l.rating).length).toFixed(1)
      : '-',
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmée' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Terminée' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
    };
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Tableau de bord propriétaire
          </h1>
          <p className="text-gray-500 mt-1">
            Bonjour {user?.firstName}, gérez vos logements et réservations
          </p>
        </div>
        <Link
          href="/owner/listings/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Créer une annonce
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Home className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
              <p className="text-xs text-gray-500">Annonces actives</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500">Réservations</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Star className="text-yellow-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-xs text-gray-500">Note moyenne</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-accent-dark" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
              <p className="text-xs text-gray-500">Total annonces</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mes logements */}
      <div className="mb-8">
        <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">
          Mes logements ({listings.length})
        </h2>

        {listings.length === 0 ? (
          <div className="card p-12 text-center">
            <Home className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="font-semibold text-gray-900 mb-2">Aucun logement</h3>
            <p className="text-gray-500 mb-6">
              Publiez votre premier logement pour commencer à recevoir des réservations
            </p>
            <Link href="/owner/listings/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Créer ma première annonce
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="card p-4 flex flex-col sm:flex-row gap-4">
                {/* Photo */}
                <div className="relative w-full sm:w-40 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {listing.photos && listing.photos.length > 0 ? (
                    <Image
                      src={listing.photos[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="text-gray-300" size={32} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                      <p className="text-sm text-gray-500">
                        {listing.city} · {listing.nuclearPlant?.name}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {listing.isVerified ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          <CheckCircle size={12} /> Vérifié
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                          <Clock size={12} /> En attente
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <span className="font-semibold text-primary">
                      {formatPrice(listing.pricePerWeek)}/sem
                    </span>
                    {listing.rating && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        {listing.rating} ({listing.reviewCount})
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {listing.bookingsCount} réservation{listing.bookingsCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-button transition-colors"
                    >
                      <Eye size={14} /> Voir
                    </Link>
                    <Link
                      href={`/owner/listings/${listing.id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-button transition-colors"
                    >
                      <Edit2 size={14} /> Modifier
                    </Link>
                    <button
                      onClick={() => toggleActive(listing.id, listing.isActive)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-button transition-colors ${
                        listing.isActive
                          ? 'text-green-700 bg-green-50 hover:bg-green-100'
                          : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {listing.isActive ? (
                        <><ToggleRight size={14} /> Active</>
                      ) : (
                        <><ToggleLeft size={14} /> Inactive</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Réservations récentes */}
      {recentBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">
            Réservations récentes
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locataire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">
                          {booking.tenant?.firstName} {booking.tenant?.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]">
                        {booking.listing?.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(booking.checkInDate).toLocaleDateString('fr-FR')} → {new Date(booking.checkOutDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(booking.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
