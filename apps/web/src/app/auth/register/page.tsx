'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const defaultRole = searchParams.get('role') || 'TENANT';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: defaultRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register(form) as { user: any; token: string };
      setAuth(result.user, result.token);
      toast.success('Compte créé avec succès !');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-2">Rejoignez Les Gîtes du Nucléaire</p>
        </div>

        {/* Sélecteur de rôle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => updateForm('role', 'TENANT')}
            className={`flex-1 py-3 rounded-button font-semibold text-sm transition-colors ${
              form.role === 'TENANT'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Je cherche un logement
          </button>
          <button
            type="button"
            onClick={() => updateForm('role', 'OWNER')}
            className={`flex-1 py-3 rounded-button font-semibold text-sm transition-colors ${
              form.role === 'OWNER'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Je suis propriétaire
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateForm('firstName', e.target.value)}
                  className="input-field pl-10"
                  placeholder="Jean"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateForm('lastName', e.target.value)}
                className="input-field"
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="input-field pl-10"
                placeholder="votre@email.fr"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className="input-field pl-10"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
                className="input-field pl-10 pr-10"
                placeholder="8 caractères minimum"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
