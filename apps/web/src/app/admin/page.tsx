'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Users,
  Home,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart2,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  Euro,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatPrice, formatDate } from '@gites/shared';
import type { AdminDashboardStats } from '@gites/shared';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-heading font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card shadow-elevated w-full max-w-md p-6">
        <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">
          Refuser l'annonce
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Indiquez la raison du refus. Elle sera communiquée au propriétaire.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input-field min-h-[100px] resize-none"
          placeholder="Ex : Photos insuffisantes, description incomplète..."
          required
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onConfirm(comment)}
            disabled={!comment.trim()}
            className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
          >
            Confirmer le refus
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingListingCard({
  listing,
  onApprove,
  onReject,
}: {
  listing: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const photo = listing.photos?.[0];

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row">
        {/* Photo */}
        <div className="relative w-full sm:w-40 h-36 sm:h-auto flex-shrink-0 bg-gray-200">
          {photo ? (
            <Image src={photo} alt={listing.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="text-gray-400" size={32} />
            </div>
          )}
          <span className="absolute top-2 left-2 badge bg-yellow-100 text-yellow-800 text-xs">
            En attente
          </span>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin size={13} />
                {listing.city} · {listing.nuclearPlant?.name}
              </p>
            </div>
            <span className="text-primary font-heading font-bold text-lg flex-shrink-0">
              {formatPrice(listing.pricePerWeek)}<span className="text-sm font-normal text-gray-500">/sem.</span>
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Par : <strong className="text-gray-700">{listing.owner?.firstName} {listing.owner?.lastName}</strong></span>
            <span>Soumis le : {formatDate(listing.createdAt)}</span>
          </div>

          {/* Description expandable */}
          {listing.description && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Masquer' : 'Voir la description'}
              </button>
              {expanded && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-4">
                  {listing.description}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => onApprove(listing.id)}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
            >
              <CheckCircle size={16} />
              Approuver
            </button>
            <button
              onClick={() => onReject(listing.id)}
              className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
            >
              <XCircle size={16} />
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'listings' | 'users'>('dashboard');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      toast.error('Accès refusé');
      router.push('/');
      return;
    }
    loadData();
  }, [isAuthenticated, token, user]);

  async function loadData() {
    if (!token) return;
    setLoading(true);
    try {
      const [dashboardData, pendingData] = await Promise.all([
        adminAPI.getDashboard(token) as Promise<{ stats: AdminDashboardStats }>,
        adminAPI.getPendingListings(token) as Promise<{ listings: any[] }>,
      ]);
      setStats(dashboardData.stats);
      setPendingListings(pendingData.listings);
    } catch (error) {
      toast.error('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (!token) return;
    try {
      await adminAPI.verifyListing(token, id, { isVerified: true });
      toast.success('Annonce approuvée !');
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      if (stats) {
        setStats({ ...stats, pendingListings: stats.pendingListings - 1 });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'approbation');
    }
  }

  async function handleReject(id: string, comment: string) {
    if (!token) return;
    try {
      await adminAPI.verifyListing(token, id, { isVerified: false, adminComment: comment });
      toast.success('Annonce refusée');
      setPendingListings((prev) => prev.filter((l) => l.id !== id));
      if (stats) {
        setStats({ ...stats, pendingListings: stats.pendingListings - 1 });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du refus');
    } finally {
      setRejectTarget(null);
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  const tabs = [
    { key: 'dashboard' as const, label: 'Tableau de bord', icon: BarChart2 },
    {
      key: 'listings' as const,
      label: 'Annonces en attente',
      icon: Home,
      count: pendingListings.length,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <ShieldCheck className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-500">Gestion de la plateforme</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
            {count !== undefined && count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Statistiques */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                <StatCard
                  label="Utilisateurs"
                  value={stats.totalUsers.toLocaleString('fr-FR')}
                  icon={Users}
                  color="bg-blue-500"
                  sub="inscrits"
                />
                <StatCard
                  label="Annonces"
                  value={stats.totalListings.toLocaleString('fr-FR')}
                  icon={Home}
                  color="bg-green-500"
                  sub="publiées"
                />
                <StatCard
                  label="Réservations"
                  value={stats.totalBookings.toLocaleString('fr-FR')}
                  icon={Calendar}
                  color="bg-purple-500"
                  sub="au total"
                />
                <StatCard
                  label="Revenus"
                  value={formatPrice(stats.totalRevenue)}
                  icon={Euro}
                  color="bg-primary"
                  sub="commissions plateforme"
                />
                <StatCard
                  label="Abonnements"
                  value={stats.activeSubscriptions}
                  icon={TrendingUp}
                  color="bg-accent-dark"
                  sub="propriétaires actifs"
                />
                <StatCard
                  label="En attente"
                  value={stats.pendingListings}
                  icon={Clock}
                  color="bg-orange-500"
                  sub="annonces à valider"
                />
              </div>

              {/* Graphique revenus mensuels */}
              {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
                <div className="card p-6 mb-6">
                  <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">
                    Revenus mensuels
                  </h2>
                  <div className="flex items-end gap-2 h-32">
                    {stats.monthlyRevenue.map((item) => {
                      const max = Math.max(...stats.monthlyRevenue.map((r) => r.amount));
                      const pct = max > 0 ? (item.amount / max) * 100 : 0;
                      return (
                        <div
                          key={item.month}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                            <div
                              className="w-full bg-primary rounded-t-sm min-h-[4px] transition-all"
                              style={{ height: `${Math.max(pct, 4)}%` }}
                              title={formatPrice(item.amount)}
                            />
                          </div>
                          <span className="text-xs text-gray-400 truncate w-full text-center">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Réservations par centrale */}
              {stats.bookingsByPlant && stats.bookingsByPlant.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">
                    Réservations par centrale
                  </h2>
                  <div className="space-y-3">
                    {stats.bookingsByPlant
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 8)
                      .map((item) => {
                        const max = Math.max(...stats.bookingsByPlant.map((r) => r.count));
                        const pct = max > 0 ? (item.count / max) * 100 : 0;
                        return (
                          <div key={item.plantName} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-40 truncate flex-shrink-0">
                              {item.plantName}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-8 text-right flex-shrink-0">
                              {item.count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-12">Aucune donnée disponible</p>
          )}
        </>
      )}

      {/* Annonces en attente */}
      {activeTab === 'listings' && (
        <>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card animate-pulse flex">
                  <div className="w-40 h-36 bg-gray-200 flex-shrink-0" />
                  <div className="p-4 flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingListings.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="mx-auto text-green-300 mb-4" size={64} />
              <h2 className="text-xl font-heading font-bold text-gray-500">
                Toutes les annonces sont validées
              </h2>
              <p className="text-gray-400 mt-2">
                Aucune annonce en attente de modération.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {pendingListings.length} annonce{pendingListings.length > 1 ? 's' : ''} en
                attente de validation
              </p>
              {pendingListings.map((listing) => (
                <PendingListingCard
                  key={listing.id}
                  listing={listing}
                  onApprove={handleApprove}
                  onReject={(id) => setRejectTarget(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal refus */}
      {rejectTarget && (
        <RejectModal
          onConfirm={(comment) => handleReject(rejectTarget, comment)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
