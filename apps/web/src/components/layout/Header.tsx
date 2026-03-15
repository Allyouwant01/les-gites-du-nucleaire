'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth-store';
import { Menu, X, User, LogOut, Home, MessageSquare, Bell, Settings } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white shadow-card sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-lgn.svg"
              alt="LGN - Les Gîtes du Nucléaire"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <span className="font-heading font-bold text-primary text-lg hidden sm:block">
              Les Gîtes du Nucléaire
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
            >
              Accueil
            </Link>
            <Link
              href="/listings"
              className="text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
            >
              Logements
            </Link>

            {isAuthenticated && user ? (
              <>
                <Link
                  href="/bookings"
                  className="text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                >
                  Réservations
                </Link>
                <Link href="/messages" className="relative text-gray-600 hover:text-primary transition-colors">
                  <MessageSquare size={20} />
                </Link>
                <Link href="/notifications" className="relative text-gray-600 hover:text-primary transition-colors">
                  <Bell size={20} />
                </Link>

                {/* Menu profil */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:shadow-card transition-shadow"
                  >
                    <Menu size={16} />
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-card shadow-elevated py-2 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User size={16} /> Mon profil
                      </Link>
                      {user.role === 'OWNER' && (
                        <Link
                          href="/owner/dashboard"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Home size={16} /> Tableau de bord
                        </Link>
                      )}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings size={16} /> Administration
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut size={16} /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
                  Connexion
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Menu mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile ouvert */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-button"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="/listings"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-button"
                onClick={() => setIsMenuOpen(false)}
              >
                Logements
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/bookings"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-button"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Réservations
                  </Link>
                  <Link
                    href="/messages"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-button"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    href="/profile"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-button"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mon profil
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-button text-left"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-primary font-semibold hover:bg-gray-50 rounded-button"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn-primary text-center mx-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
