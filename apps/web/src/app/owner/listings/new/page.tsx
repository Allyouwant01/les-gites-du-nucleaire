'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Upload, Plus, X, MapPin, Euro, Bed, Bath, Users, FileText,
  ChevronLeft, Loader2, ImagePlus, Check
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

export default function NewListingPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  // Form state
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
    loadPlants();
  }, [hydrated, isAuthenticated, user]);

  async function loadPlants() {
    try {
      const res = await plantsAPI.getAll();
      setPlants(res.plants || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des centrales');
    } finally {
      setLoadingPlants(false);
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

  function handlePlantChange(plantId: string) {
    updateForm('nuclearPlantId', plantId);
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      // Pré-remplir la ville et les coordonnées approximatives
      if (!form.city) updateForm('city', plant.city);
      if (form.latitude === 0) updateForm('latitude', plant.latitude);
      if (form.longitude === 0) updateForm('longitude', plant.longitude);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (photoFiles.length + files.length > 10) {
      toast.error('Maximum 10 photos');
      return;
    }
    const newFiles = [...photoFiles, ...files];
    setPhotoFiles(newFiles);

    // Générer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (form.title.length < 5) newErrors.title = 'Le titre doit contenir au moins 5 caractères';
    if (form.description.length < 20) newErrors.description = 'La description doit contenir au moins 20 caractères';
    if (!form.address || form.address.length < 5) newErrors.address = "L'adresse est requise";
    if (!form.city || form.city.length < 2) newErrors.city = 'La ville est requise';
    if (!/^\d{5}$/.test(form.postalCode)) newErrors.postalCode = 'Code postal invalide (5 chiffres)';
    if (!form.nuclearPlantId) newErrors.nuclearPlantId = 'Sélectionnez une centrale nucléaire';
    if (form.pricePerWeek <= 0) newErrors.pricePerWeek = 'Le prix doit être supérieur à 0';
    if (form.pricePerWeek > 5000) newErrors.pricePerWeek = 'Le prix ne peut pas dépasser 5 000€';
    if (photoFiles.length === 0) newErrors.photos = 'Ajoutez au moins une photo';

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
      // 1. Créer le listing
      const res: any = await listingsAPI.create(token!, {
        ...form,
        pricePerWeek: Number(form.pricePerWeek),
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      });

      // 2. Upload les photos
      if (photoFiles.length > 0) {
        try {
          await listingsAPI.uploadPhotos(token!, res.listing.id, photoFiles);
        } catch {
          // Photos en erreur, mais le listing est créé
          toast.error('Logement créé mais erreur lors de l\'upload des photos. Vous pourrez les ajouter plus tard.');
        }
      }

      toast.success('Logement créé avec succès ! Il sera visible après vérification par un administrateur.');
      router.push('/owner/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  }

  if (loadingPlants) {
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
          <h1 className="text-2xl font-heading font-bold text-gray-900">Créer une annonce</h1>
          <p className="text-gray-500 text-sm">Publiez votre logement pour les intervenants du nucléaire</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Infos générales */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Informations générales
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de l&apos;annonce *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Ex: Appartement T2 lumineux proche Gravelines"
                maxLength={100}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              <p className="text-gray-400 text-xs mt-1">{form.title.length}/100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                className={`input-field min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Décrivez votre logement en détail : emplacement, équipements, ambiance..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              <p className="text-gray-400 text-xs mt-1">{form.description.length} caractères (min. 20)</p>
            </div>
          </div>
        </section>

        {/* Section 2: Localisation */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Localisation
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Centrale nucléaire la plus proche *
              </label>
              <select
                value={form.nuclearPlantId}
                onChange={e => handlePlantChange(e.target.value)}
                className={`input-field ${errors.nuclearPlantId ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionnez une centrale</option>
                {plants.map(plant => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name} ({plant.city})
                  </option>
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
                placeholder="12 rue de la Paix"
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
                  placeholder="Gravelines"
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
                  placeholder="59820"
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
                  placeholder="48.8566"
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
                  placeholder="2.3522"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Détails */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Euro size={20} className="text-primary" />
            Détails et tarif
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix par semaine (€) *
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={form.pricePerWeek || ''}
                  onChange={e => updateForm('pricePerWeek', parseFloat(e.target.value) || 0)}
                  className={`input-field pl-10 ${errors.pricePerWeek ? 'border-red-500' : ''}`}
                  placeholder="350"
                  min={0}
                  max={5000}
                />
              </div>
              {errors.pricePerWeek && <p className="text-red-500 text-xs mt-1">{errors.pricePerWeek}</p>}
              <p className="text-gray-400 text-xs mt-1">Commission plateforme : 10% prélevés sur chaque réservation</p>
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
                  min={1}
                  max={20}
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
                  min={1}
                  max={10}
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
                  min={1}
                  max={5}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Équipements */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
            Équipements
          </h2>
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

        {/* Section 5: Règles */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
            Règles du logement
          </h2>
          <textarea
            value={form.houseRules}
            onChange={e => updateForm('houseRules', e.target.value)}
            className="input-field min-h-[80px]"
            placeholder="Ex: Non fumeur, pas d'animaux, heures de silence 22h-7h..."
          />
        </section>

        {/* Section 6: Photos */}
        <section className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImagePlus size={20} className="text-primary" />
            Photos *
          </h2>

          {errors.photos && (
            <p className="text-red-500 text-sm mb-3">{errors.photos}</p>
          )}

          {/* Previews */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img src={preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-white text-[10px] rounded-full font-medium">
                      Principale
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          {photoFiles.length < 10 && (
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm font-medium text-gray-700">
                Cliquez pour ajouter des photos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG · Max 10 photos · La première sera la photo principale
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </section>

        {/* Submit */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Création en cours...</>
              ) : (
                <><Plus size={18} /> Publier l&apos;annonce</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
