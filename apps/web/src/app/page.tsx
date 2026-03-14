'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Shield, CreditCard, Users, ChevronRight, Zap } from 'lucide-react';
import { plantsAPI } from '@/lib/api';
import FranceNuclearMap from '@/components/map/FranceNuclearMap';

export default function HomePage() {
  const [plants, setPlants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    plantsAPI.getAll().then(({ plants }) => {
      setPlants(plants);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredPlants = plants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1630142895963-6996ae6b3a5b?w=1920&q=80&fit=crop"
            alt="Centrale nucléaire - tours de refroidissement"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        {/* Dark overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-primary-dark/90" />

        {/* Floating nuclear icons decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-20 h-20 rounded-full bg-accent/10 blur-2xl animate-pulse" />
          <div className="absolute top-40 right-[15%] w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-[20%] w-24 h-24 rounded-full bg-primary/20 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full mb-8">
              <Zap size={16} className="text-accent" />
              <span>La plateforme N°1 des travailleurs du nucléaire</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Trouvez votre logement
              <span className="text-accent block mt-2">près de votre centrale</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow">
              La plateforme de réservation conçue pour les travailleurs du nucléaire.
              Logements vérifiés, paiement hebdomadaire, sans arnaque.
            </p>

            {/* Barre de recherche */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une centrale, une ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 text-lg shadow-elevated
                           focus:outline-none focus:ring-4 focus:ring-accent/50 transition-all"
              />
            </div>

            {/* Stats rapides */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-10 text-white/90">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-accent">18</div>
                <div className="text-xs md:text-sm text-gray-300">Centrales</div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-accent">56</div>
                <div className="text-xs md:text-sm text-gray-300">Réacteurs</div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-accent">54+</div>
                <div className="text-xs md:text-sm text-gray-300">Logements</div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-heading font-bold text-accent">8€</div>
                <div className="text-xs md:text-sm text-gray-300">/mois propriétaire</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 80L60 74.7C120 69 240 59 360 48C480 37 600 27 720 32C840 37 960 59 1080 64C1200 69 1320 59 1380 53L1440 48V80H0Z"
              fill="#F8F9FA"
            />
          </svg>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Anti-arnaque',
                desc: 'Propriétaires et logements vérifiés par notre équipe',
              },
              {
                icon: CreditCard,
                title: 'Paiement hebdo',
                desc: 'Payez semaine par semaine, jamais la totalité d\'avance',
              },
              {
                icon: Users,
                title: 'Paiement partagé',
                desc: 'Divisez le loyer entre colocataires facilement',
              },
              {
                icon: Zap,
                title: 'Espèces acceptées',
                desc: 'Payez en espèces directement au propriétaire',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 bg-accent/20 rounded-card flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-primary" size={28} />
                </div>
                <h3 className="font-heading font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carte interactive des centrales nucléaires */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FranceNuclearMap />
        </div>
      </section>

      {/* Grille des centrales (résultats de recherche) */}
      {searchQuery && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
              Résultats pour &quot;{searchQuery}&quot;
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-40 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlants.map((plant, index) => (
                  <Link key={plant.id} href={`/listings?plant=${plant.id}`}>
                    <div
                      className="card group cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="h-40 bg-gradient-to-br from-primary to-primary-light relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Zap className="text-white/20" size={80} />
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-accent text-gray-900 text-xs font-bold px-2 py-1 rounded-badge">
                            {plant.reactorCount} réacteur{plant.reactorCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-heading font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {plant.name}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <MapPin size={14} />
                          <span>{plant.city}, {plant.department}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-primary font-semibold">
                            {plant.listingsCount} logement{plant.listingsCount !== 1 ? 's' : ''}
                          </span>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {filteredPlants.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Aucune centrale trouvée pour &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Vous êtes propriétaire ?
          </h2>
          <p className="text-gray-200 text-lg mb-8">
            Publiez votre logement et accueillez des travailleurs du nucléaire en grand déplacement.
            Abonnement à seulement 8€/mois.
          </p>
          <Link href="/auth/register?role=OWNER" className="btn-accent text-lg px-8 py-4 inline-block">
            Devenir propriétaire
          </Link>
        </div>
      </section>
    </div>
  );
}
