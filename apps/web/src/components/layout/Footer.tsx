'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-lgn-yellow.svg"
                alt="LGN - Les Gîtes du Nucléaire"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="font-heading font-bold text-lg">Les Gîtes du Nucléaire</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              La plateforme de référence pour les travailleurs du nucléaire en grand déplacement.
              Logements vérifiés, paiement hebdomadaire.
            </p>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-heading font-bold text-accent mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/listings" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Logements
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Devenir propriétaire
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="font-heading font-bold text-accent mb-4">Informations</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-accent mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <Mail size={16} /> contact@lesgitesdunucleaire.fr
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <Phone size={16} /> 06 58 26 36 44
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <MapPin size={16} /> Paris, France
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-light mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Les Gîtes du Nucléaire. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
