'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Star, Filter, SlidersHorizontal, ChevronDown, Users, BedDouble } from 'lucide-react';
import { plantsAPI } from '@/lib/api';
import { formatPrice, AMENITIES } from '@gites/shared';

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const plantId = searchParams.get('plant');

  const [plant, setPlant] = useState<any>(null);
  const [plants, setPlants] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(plantId || '');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    guests: '',
    bedrooms: '',
    sortBy: 'distance',
  });

  // Charger les centrales
  useEffect(() => {
    plantsAPI.getAll().then(({ plants }) => setPlants(plants));
  }, []);

  // Charger les logements quand une centrale est sélectionnée
  useEffect(() => {
    if (!selectedPlant) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.guests) params.set('guests', filters.guests);
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
    params.set('sortBy', filters.sortBy);

    Promise.all([
      plantsAPI.getById(selectedPlant),
      plantsAPI.getListings(selectedPlant, params),
    ]).then(([plantData, listingsData]) => {
      setPlant(plantData.plant);
      setListings(listingsData.listings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedPlant, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sélecteur de centrale et filtres */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">
          {plant ? `Logements près de ${plant.name}` : 'Trouver un logement'}
        </h1>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Sélecteur de centrale */}
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="input-field pl-10 appearance-none cursor-pointer"
            >
              <option value="">Sélectionnez une centrale nucléaire</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.department} ({p.listingsCount} logements)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <SlidersHorizontal size={18} />
            Filtres
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="card p-6 mt-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix min/semaine</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="input-field"
                  placeholder="0 €"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix max/semaine</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="input-field"
                  placeholder="1000 €"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voyageurs</label>
                <select
                  value={filters.guests}
                  onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
                  className="input-field"
                >
                  <option value="">Tous</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}+ personnes</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chambres</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                  className="input-field"
                >
                  <option value="">Toutes</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}+ chambres</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="input-field"
                >
                  <option value="distance">Distance</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="newest">Plus récent</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Résultats */}
      {!selectedPlant ? (
        <div className="text-center py-20">
          <MapPin className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-heading font-bold text-gray-500">
            Sélectionnez une centrale nucléaire
          </h2>
          <p className="text-gray-400 mt-2">
            Choisissez votre lieu de mission pour voir les logements disponibles
          </p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-heading font-bold text-gray-500">
            Aucun logement trouvé
          </h2>
          <p className="text-gray-400 mt-2">
            Essayez de modifier vos filtres ou de chercher près d'une autre centrale
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">{listings.length} logement{listings.length > 1 ? 's' : ''} trouvé{listings.length > 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, index) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <div
                  className="card group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Photo */}
                  <div className="relative h-48 bg-gray-200">
                    {listing.photos[0] ? (
                      <Image
                        src={listing.photos[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Pas de photo
                      </div>
                    )}
                    {listing.isVerified && (
                      <span className="absolute top-3 left-3 badge-verified text-xs">
                        Vérifié
                      </span>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <MapPin size={14} />
                      <span>{listing.city}</span>
                      {listing.distanceToPlant && (
                        <span className="text-primary font-medium ml-1">
                          ({listing.distanceToPlant} km)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {listing.maxGuests}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble size={14} /> {listing.bedrooms}
                      </span>
                      {listing.rating && (
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-accent fill-accent" />
                          {listing.rating} ({listing.reviewCount})
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <span className="text-xl font-heading font-bold text-primary">
                          {formatPrice(listing.pricePerWeek)}
                        </span>
                        <span className="text-sm text-gray-500"> / semaine</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
