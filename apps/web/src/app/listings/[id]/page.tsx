'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  MapPin, Star, Users, BedDouble, Bath, Wifi, Car, ChevronLeft, ChevronRight,
  Shield, Calendar, MessageSquare, Heart, Share2, Check,
} from 'lucide-react';
import { listingsAPI, bookingsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatPrice, formatDate, AMENITIES } from '@gites/shared';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    paymentMethod: 'CARD' as 'CARD' | 'CASH' | 'SPLIT',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState<{ checkInDate: string; checkOutDate: string }[]>([]);

  useEffect(() => {
    Promise.all([
      listingsAPI.getById(id as string),
      listingsAPI.getBookedDates(id as string).catch(() => ({ bookedDates: [] })),
    ]).then(([listingData, bookedData]) => {
      setListing(listingData.listing);
      setBookedDates(bookedData.bookedDates);
      setLoading(false);
    }).catch(() => {
      toast.error('Logement non trouvé');
      setLoading(false);
    });
  }, [id]);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      toast.error('Connectez-vous pour réserver');
      router.push('/auth/login');
      return;
    }

    setBookingLoading(true);
    try {
      const result = await bookingsAPI.create(token, {
        listingId: id,
        checkInDate: new Date(bookingForm.checkInDate).toISOString(),
        checkOutDate: new Date(bookingForm.checkOutDate).toISOString(),
        numberOfGuests: bookingForm.numberOfGuests,
        paymentMethod: bookingForm.paymentMethod,
      }) as { booking: any };

      toast.success('Réservation créée avec succès !');
      router.push(`/bookings/${result.booking.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réservation');
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-card" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-heading font-bold text-gray-500">Logement non trouvé</h1>
      </div>
    );
  }

  const photos = listing.photos.length > 0 ? listing.photos : ['/placeholder.jpg'];
  const amenityIcons: Record<string, any> = { WiFi: Wifi, Parking: Car };

  // Calcul du nombre de semaines
  let numberOfWeeks = 0;
  let totalPrice = 0;
  if (bookingForm.checkInDate && bookingForm.checkOutDate) {
    const start = new Date(bookingForm.checkInDate);
    const end = new Date(bookingForm.checkOutDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    numberOfWeeks = Math.ceil(diffDays / 7);
    totalPrice = numberOfWeeks * Number(listing.pricePerWeek);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Fil d'ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <ChevronRight size={14} />
        <Link href={`/listings?plant=${listing.nuclearPlant?.id}`} className="hover:text-primary">
          {listing.nuclearPlant?.name}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2">
          {/* Carrousel photos */}
          <div className="relative h-[400px] md:h-[500px] rounded-card overflow-hidden bg-gray-200">
            {photos[currentPhoto] && (
              <Image
                src={photos[currentPhoto]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            )}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-card hover:bg-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentPhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-card hover:bg-white"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhoto(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentPhoto ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            {listing.isVerified && (
              <div className="absolute top-3 left-3 badge-verified">
                <Shield size={14} className="mr-1" /> Vérifié
              </div>
            )}
          </div>

          {/* Titre et infos */}
          <div className="mt-6">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {listing.city} ({listing.postalCode})
              </span>
              {listing.distanceToPlant && (
                <span className="text-primary font-semibold">
                  {listing.distanceToPlant} km de {listing.nuclearPlant?.name}
                </span>
              )}
              {listing.rating && (
                <span className="flex items-center gap-1">
                  <Star size={16} className="text-accent fill-accent" />
                  {listing.rating} ({listing.reviewCount} avis)
                </span>
              )}
            </div>

            <div className="flex items-center gap-6 mt-4 text-gray-700">
              <span className="flex items-center gap-2">
                <Users size={18} /> {listing.maxGuests} voyageurs
              </span>
              <span className="flex items-center gap-2">
                <BedDouble size={18} /> {listing.bedrooms} chambre{listing.bedrooms > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-2">
                <Bath size={18} /> {listing.bathrooms} sdb
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Calendrier de disponibilité */}
          <div className="mt-8">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={22} className="text-primary" />
              Disponibilités
            </h2>
            <div className="card p-5">
              <AvailabilityCalendar
                availabilities={listing.availabilities || []}
                bookedDates={bookedDates}
                checkInDate={bookingForm.checkInDate}
                checkOutDate={bookingForm.checkOutDate}
                onDateSelect={(checkIn, checkOut) =>
                  setBookingForm({ ...bookingForm, checkInDate: checkIn, checkOutDate: checkOut })
                }
              />
            </div>
          </div>

          {/* Équipements */}
          <div className="mt-8">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">Équipements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {listing.amenities.map((amenity: string) => (
                <div key={amenity} className="flex items-center gap-2 text-gray-700">
                  <Check size={16} className="text-green-600" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Règlement intérieur */}
          {listing.houseRules && (
            <div className="mt-8">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">Règlement intérieur</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.houseRules}</p>
            </div>
          )}

          {/* Propriétaire */}
          <div className="mt-8 card p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Votre hôte</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {listing.owner?.firstName?.[0]}{listing.owner?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {listing.owner?.firstName} {listing.owner?.lastName}
                </p>
                {listing.owner?.isVerified && (
                  <span className="badge-verified text-xs mt-1">Identité vérifiée</span>
                )}
              </div>
            </div>
          </div>

          {/* Avis */}
          <div className="mt-8">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">
              Avis ({listing.reviewCount})
            </h2>
            {listing.reviews?.length > 0 ? (
              <div className="space-y-4">
                {listing.reviews.map((review: any) => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {review.author?.firstName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{review.author?.firstName}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < review.rating ? 'text-accent fill-accent' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                    {review.response && (
                      <div className="mt-3 pl-4 border-l-2 border-primary-light">
                        <p className="text-sm text-gray-500 font-medium">Réponse du propriétaire :</p>
                        <p className="text-sm text-gray-700">{review.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun avis pour le moment</p>
            )}
          </div>
        </div>

        {/* Sidebar - Réservation */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex items-end gap-2 mb-6">
              <span className="text-3xl font-heading font-bold text-primary">
                {formatPrice(Number(listing.pricePerWeek))}
              </span>
              <span className="text-gray-500 pb-1">/ semaine</span>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              {/* Mini calendrier dans la sidebar */}
              <div className="border border-gray-200 rounded-xl p-3">
                <AvailabilityCalendar
                  availabilities={listing.availabilities || []}
                  bookedDates={bookedDates}
                  checkInDate={bookingForm.checkInDate}
                  checkOutDate={bookingForm.checkOutDate}
                  onDateSelect={(checkIn, checkOut) =>
                    setBookingForm({ ...bookingForm, checkInDate: checkIn, checkOutDate: checkOut })
                  }
                  compact
                />
              </div>

              {/* Dates sélectionnées */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">Arrivée</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {bookingForm.checkInDate
                      ? new Date(bookingForm.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">Départ</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {bookingForm.checkOutDate
                      ? new Date(bookingForm.checkOutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
              {/* Hidden inputs for form validation */}
              <input type="hidden" name="checkInDate" value={bookingForm.checkInDate} required />
              <input type="hidden" name="checkOutDate" value={bookingForm.checkOutDate} required />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voyageurs</label>
                <select
                  value={bookingForm.numberOfGuests}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, numberOfGuests: parseInt(e.target.value) })
                  }
                  className="input-field text-sm"
                >
                  {Array.from({ length: listing.maxGuests }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} voyageur{i > 0 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <div className="space-y-2">
                  {[
                    { value: 'CARD', label: 'Carte bancaire', desc: 'Prélèvement automatique chaque semaine' },
                    { value: 'CASH', label: 'Espèces', desc: 'Paiement direct au propriétaire + dépôt en ligne' },
                    { value: 'SPLIT', label: 'Paiement partagé', desc: 'Divisez entre colocataires' },
                  ].map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-3 rounded-button border cursor-pointer transition-colors ${
                        bookingForm.paymentMethod === value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={value}
                        checked={bookingForm.paymentMethod === value}
                        onChange={() =>
                          setBookingForm({ ...bookingForm, paymentMethod: value as any })
                        }
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-sm">{label}</span>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Récapitulatif */}
              {numberOfWeeks > 0 && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatPrice(Number(listing.pricePerWeek))} x {numberOfWeeks} semaine{numberOfWeeks > 1 ? 's' : ''}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Commission plateforme (8%)</span>
                    <span>{formatPrice(totalPrice * 0.08)}</span>
                  </div>
                  <div className="flex justify-between font-heading font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Vous paierez {formatPrice(Number(listing.pricePerWeek))} par semaine
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={bookingLoading || !bookingForm.checkInDate || !bookingForm.checkOutDate}
                className="btn-primary w-full text-lg"
              >
                {bookingLoading ? 'Réservation...' : 'Réserver'}
              </button>
            </form>

            {/* Contacter le propriétaire */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  router.push('/auth/login');
                  return;
                }
                router.push(`/messages?to=${listing.owner?.id}&listing=${listing.id}`);
              }}
              className="btn-secondary w-full mt-3 flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} /> Contacter l'hôte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
