'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Upload, X, MapPin, Euro, Bed, Bath, Users, FileText,
  ChevronLeft, Loader2, ImagePlus, Check, Save
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { plantsAPI, listingsAPI } from '@/lib/api';
import { AMENITIES } from '@gites/shared';

interface Plant {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuthStore();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    nuclearPlantId: '',
    latitude: 0,
    longitude: 0,
    pricePerWeek: 0,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    houseRules: '',
  });

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
  }, [hydrated, isAuthenticated, user, id]);

  async function loadData() {
    try {
      setLoadingData(true);
      const [plantsRes, listingRes] = await Promise.all([
        plantsAPI.getAll(),
        listingsAPI.getById(id as string),
      ]);
      setPlants(plantsRes.plants || []);

      const listing = listingRes.listing;
      setForm({
        title: listing.title || '',
        description: listing.description || '',
        address: listing.address || '',
        city: listing.city || '',
        postalCode: listing.postalCode || '',
        nuclearPlantId: listing.nuclearPlantId || '',
        latitude: listing.latitude || 0,
        longitude: listing.longitude || 0,
        pricePerWeek: listing.pricePerWeek || 0,
        maxGuests: listing.maxGuests || 1,
        bedrooms: listing.bedrooms || 1,
        bathrooms: listing.bathrooms || 1,
        amenities: listing.amenities || [],
        houseRules: listing.houseRules || '',
      });
      setExistingPhotos(listing.photos || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement du logement');
      router.push('/owner/dashboard');
    } finally {
      setLoadingData(false);
    }
  }

  function updateForm(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  function toggleAmenity(amenity: string) {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalPhotos = existingPhotos.length + newPhotoFiles.length + files.length;
    if (totalPhotos > 10) {
      toast.error('Maximum 10 photos au total');
      return;
    }
    setNewPhotoFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeNewPhoto(index: number) {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (form.title.length < 5) newErrors.title = 'Le titre doit contenir au moins 5 caractères';
    if (form.description.length < 20) newErrors.description = 'La description doit contenir au moins 20 caractères';
    if (!form.address || form.address.length < 5) newErrors.address = "L'adresse est requise";
    if (!form.city || form.city.length < 2) newErrors.city = 'La ville est requise';
    if (!/^\d{5}$/.test(form.postalCode)) newErrors.postalCode = 'Code postal invalide';
    if (!form.nuclearPlantId) newErrors.nuclearPlantId = 'Sélectionnez une centrale';
    if (form.pricePerWeek <= 0) newErrors.pricePerWeek = 'Le prix doit être positif';
    if (form.pricePerWeek > 5000) newErrors.pricePerWeek = 'Max 5 000€';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setLoading(true);
    try {
      await listingsAPI.update(token!, id as string, {
        ...form,
        pricePerWeek: Number(form.pricePerWeek),
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      });

      if (newPhotoFiles.length > 0) {
        try {
          await listingsAPI.uploadPhotos(token!, id as string, newPhotoFiles);
        } catch {
          toast.error('Modifications sauvegardées mais erreur upload photos');
        }
      }

      toast.success('Logement modifié avec succès !');
      router.push('/owner/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Modifier l&apos;annonce</h1>
          <p className="text-gray-500 text-sm">{form.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Infos générales */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" /> Informations générales
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                maxLength={100}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                className={`input-field min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>
        </section>

        {/* Localisation */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" /> Localisation
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centrale nucléaire *</label>
              <select
                value={form.nuclearPlantId}
                onChange={e => updateForm('nuclearPlantId', e.target.value)}
                className={`input-field ${errors.nuclearPlantId ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionnez une centrale</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                ))}
              </select>
              {errors.nuclearPlantId && <p className="text-red-500 text-xs mt-1">{errors.nuclearPlantId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                className={`input-field ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => updateForm('city', e.target.value)}
                  className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={e => updateForm('postalCode', e.target.value)}
                  className={`input-field ${errors.postalCode ? 'border-red-500' : ''}`}
                  maxLength={5}
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude || ''}
                  onChange={e => updateForm('latitude', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude || ''}
                  onChange={e => updateForm('longitude', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Détails */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Euro size={20} className="text-primary" /> Détails et tarif
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix par semaine (€) *</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={form.pricePerWeek || ''}
                  onChange={e => updateForm('pricePerWeek', parseFloat(e.target.value) || 0)}
                  className={`input-field pl-10 ${errors.pricePerWeek ? 'border-red-500' : ''}`}
                  min={0}
                  max={5000}
                />
              </div>
              {errors.pricePerWeek && <p className="text-red-500 text-xs mt-1">{errors.pricePerWeek}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Users size={14} /> Voyageurs max
                </label>
                <input
                  type="number"
                  value={form.maxGuests}
                  onChange={e => updateForm('maxGuests', parseInt(e.target.value) || 1)}
                  className="input-field"
                  min={1} max={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Bed size={14} /> Chambres
                </label>
                <input
                  type="number"
                  value={form.bedrooms}
                  onChange={e => updateForm('bedrooms', parseInt(e.target.value) || 1)}
                  className="input-field"
                  min={1} max={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Bath size={14} /> SdB
                </label>
                <input
                  type="number"
                  value={form.bathrooms}
                  onChange={e => updateForm('bathrooms', parseInt(e.target.value) || 1)}
                  className="input-field"
                  min={1} max={5}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Équipements */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">Équipements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center gap-2 px-3 py-2 rounded-button text-sm border transition-all ${
                  form.amenities.includes(amenity)
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {form.amenities.includes(amenity) && <Check size={14} />}
                {amenity}
              </button>
            ))}
          </div>
        </section>

        {/* Règles */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">Règles du logement</h2>
          <textarea
            value={form.houseRules}
            onChange={e => updateForm('houseRules', e.target.value)}
            className="input-field min-h-[80px]"
            placeholder="Ex: Non fumeur, pas d'animaux..."
          />
        </section>

        {/* Photos */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImagePlus size={20} className="text-primary" /> Photos
          </h2>

          {/* Photos existantes */}
          {existingPhotos.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Photos actuelles ({existingPhotos.length})</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {existingPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="200px" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-white text-[10px] rounded-full font-medium">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles photos */}
          {newPhotoPreviews.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Nouvelles photos ({newPhotoPreviews.length})</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {newPhotoPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img src={preview} alt={`Nouvelle ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {existingPhotos.length + newPhotoFiles.length < 10 && (
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm font-medium text-gray-700">Ajouter des photos</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG · Max 10 photos au total</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewPhotos}
                className="hidden"
              />
            </label>
          )}
        </section>

        {/* Submit */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</>
              ) : (
                <><Save size={18} /> Enregistrer les modifications</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
