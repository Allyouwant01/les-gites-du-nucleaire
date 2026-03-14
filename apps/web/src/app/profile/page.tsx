'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  CreditCard,
  LogOut,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Lock,
  ChevronRight,
  Star,
} from 'lucide-react';
import { authAPI, subscriptionsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDate, OWNER_SUBSCRIPTION_PRICE_EUR } from '@gites/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser, logout } = useAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'verification' | 'subscription' | 'security'>('info');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }
    if (user?.role === 'OWNER') {
      loadSubscription();
    }
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
  }, [isAuthenticated, token, user]);

  async function loadSubscription() {
    if (!token) return;
    setSubLoading(true);
    try {
      const { subscription: sub } = await subscriptionsAPI.getStatus(token);
      setSubscription(sub);
    } catch {
      // Pas d'abonnement actif
    } finally {
      setSubLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const { user: updated } = await authAPI.updateProfile(token, formData) as { user: any };
      updateUser(updated);
      toast.success('Profil mis à jour !');
      setEditMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur upload');
      const { avatarUrl } = await response.json();
      updateUser({ avatarUrl });
      toast.success('Photo de profil mise à jour !');
    } catch {
      toast.error('Impossible de mettre à jour la photo');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`${API_URL}/api/auth/verify-document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur upload');
      toast.success('Document envoyé pour vérification. Vous serez notifié sous 24h.');
    } catch {
      toast.error('Impossible d\'envoyer le document');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleSubscribe() {
    if (!token) return;
    setSubLoading(true);
    try {
      const { clientSecret } = await subscriptionsAPI.create(token);
      toast.success('Redirection vers le paiement…');
      // Dans une vraie app, on utiliserait Stripe Elements ici
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la souscription');
    } finally {
      setSubLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!token) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return;
    setSubLoading(true);
    try {
      await subscriptionsAPI.cancel(token);
      toast.success('Abonnement annulé');
      setSubscription(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setSubLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/');
    toast.success('Déconnecté');
  }

  if (!isAuthenticated || !user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  const isOwner = user.role === 'OWNER';

  const navItems = [
    { key: 'info' as const, label: 'Informations personnelles', icon: User },
    { key: 'verification' as const, label: 'Vérification d\'identité', icon: Shield },
    ...(isOwner ? [{ key: 'subscription' as const, label: 'Abonnement propriétaire', icon: Star }] : []),
    { key: 'security' as const, label: 'Sécurité', icon: Lock },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">Mon profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Carte profil */}
          <div className="card p-5 flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">{initials}</span>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                title="Changer la photo"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} className="text-gray-600" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="font-heading font-bold text-gray-900 mt-3">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>

            <div className="mt-2">
              {user.isVerified ? (
                <span className="badge-verified flex items-center gap-1 text-xs">
                  <CheckCircle size={12} />
                  Identité vérifiée
                </span>
              ) : (
                <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1 text-xs">
                  <AlertCircle size={12} />
                  Non vérifié
                </span>
              )}
            </div>

            <span className="mt-2 badge bg-primary/10 text-primary text-xs">
              {isOwner ? 'Propriétaire' : user.role === 'ADMIN' ? 'Administrateur' : 'Locataire'}
            </span>
          </div>

          {/* Navigation */}
          <nav className="card overflow-hidden">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-0 ${
                  activeSection === key
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          {/* Informations personnelles */}
          {activeSection === 'info' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-heading font-bold text-gray-900">
                  Informations personnelles
                </h2>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Modifier
                  </button>
                )}
              </div>

              {editMode ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="input-field"
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving} className="btn-primary">
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <InfoRow icon={User} label="Prénom" value={user.firstName} />
                  <InfoRow icon={User} label="Nom" value={user.lastName} />
                  <InfoRow icon={Mail} label="Email" value={user.email} />
                  <InfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={user.phone || '—'}
                  />
                </div>
              )}
            </div>
          )}

          {/* Vérification d'identité */}
          {activeSection === 'verification' && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
                Vérification d'identité
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Faites vérifier votre identité pour inspirer confiance aux autres utilisateurs.
                Envoyez une pièce d'identité valide (CNI, passeport ou titre de séjour).
              </p>

              {user.isVerified ? (
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-card border border-green-200">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
                  <div>
                    <p className="font-semibold text-green-800">Identité vérifiée</p>
                    <p className="text-sm text-green-600">
                      Votre identité a été confirmée par notre équipe.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-card border border-orange-200 flex items-start gap-3">
                    <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-orange-700">
                      Votre identité n'est pas encore vérifiée. Soumettez un document pour
                      accéder à toutes les fonctionnalités.
                    </p>
                  </div>

                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-card p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <UploadCloud className="mx-auto text-gray-400 mb-3" size={40} />
                    <p className="font-medium text-gray-700">
                      {uploadingDoc ? 'Envoi en cours...' : 'Cliquez pour envoyer votre document'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG ou PDF — max 5 Mo
                    </p>
                    <input
                      ref={docInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleDocumentUpload}
                      disabled={uploadingDoc}
                    />
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    Vos documents sont chiffrés et supprimés après vérification.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Abonnement propriétaire */}
          {activeSection === 'subscription' && isOwner && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
                Abonnement propriétaire
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                L'abonnement propriétaire vous permet de publier des annonces et de gérer vos
                réservations sur la plateforme.
              </p>

              {subLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-24 bg-gray-200 rounded-card" />
                </div>
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="p-5 bg-green-50 rounded-card border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-600" size={28} />
                        <div>
                          <p className="font-semibold text-green-800">Abonnement actif</p>
                          <p className="text-sm text-green-600">
                            {OWNER_SUBSCRIPTION_PRICE_EUR} €/mois · Prochaine facturation :{' '}
                            {subscription.currentPeriodEnd
                              ? formatDate(subscription.currentPeriodEnd)
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          subscription.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'PAST_DUE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {subscription.status === 'ACTIVE'
                          ? 'Actif'
                          : subscription.status === 'PAST_DUE'
                          ? 'Paiement en retard'
                          : 'Annulé'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCancelSubscription}
                    disabled={subLoading}
                    className="text-sm text-red-500 hover:text-red-700 underline"
                  >
                    Annuler l'abonnement
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 bg-gray-50 rounded-card border border-gray-200">
                    <div className="flex items-start gap-3">
                      <CreditCard className="text-gray-400 flex-shrink-0 mt-0.5" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800">Aucun abonnement actif</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Souscrivez pour {OWNER_SUBSCRIPTION_PRICE_EUR} €/mois et commencez à
                          publier vos annonces.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      'Publications illimitées d\'annonces',
                      'Gestion des réservations',
                      'Paiements sécurisés (carte + espèces)',
                      'Messagerie avec les locataires',
                      'Tableau de bord et statistiques',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={subLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} />
                    {subLoading
                      ? 'Chargement...'
                      : `S'abonner pour ${OWNER_SUBSCRIPTION_PRICE_EUR} €/mois`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sécurité */}
          {activeSection === 'security' && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-5">Sécurité</h2>

              <div className="space-y-4">
                <div className="p-4 rounded-card border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium text-gray-800">Mot de passe</p>
                        <p className="text-sm text-gray-500">
                          Dernière modification : date non disponible
                        </p>
                      </div>
                    </div>
                    <button className="btn-secondary text-sm px-4 py-2">
                      Modifier
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-card border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium text-gray-800">Adresse email</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="badge-verified text-xs">Vérifiée</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-red-600 mb-3">Zone de danger</h3>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    <LogOut size={16} />
                    Se déconnecter de tous les appareils
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
