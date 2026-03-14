// Constantes partagées de l'application

// Commission plateforme sur le locataire : 8% sur chaque paiement
export const PLATFORM_FEE_PERCENT = 8;

// Commission propriétaire : 10% prélevés sur chaque réservation
export const OWNER_COMMISSION_PERCENT = 10;

// Abonnement propriétaire : 8€/mois
export const OWNER_SUBSCRIPTION_PRICE_EUR = 8;
export const OWNER_SUBSCRIPTION_PRICE_CENTS = 800;

// Caution de sécurité pour paiement espèces
export const CASH_SECURITY_DEPOSIT_EUR = 100;
export const CASH_SECURITY_DEPOSIT_CENTS = 10000;

// Annulation : frais d'une semaine si moins de 7 jours
export const FREE_CANCELLATION_DAYS = 7;

// Paiement en retard après 3 jours
export const OVERDUE_AFTER_DAYS = 3;

// Design system - Couleurs
export const COLORS = {
  primary: '#1B4F72',
  primaryLight: '#2E86C1',
  primaryDark: '#154360',
  accent: '#F4D03F',
  accentDark: '#D4AC0D',
  white: '#FFFFFF',
  background: '#F8F9FA',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
} as const;

// Rayons d'arrondi
export const BORDER_RADIUS = {
  card: 12,
  button: 8,
  searchInput: 20,
  badge: 16,
} as const;

// Ombres
export const SHADOWS = {
  card: '0 2px 12px rgba(0,0,0,0.08)',
  elevated: '0 4px 20px rgba(0,0,0,0.12)',
  button: '0 2px 8px rgba(0,0,0,0.1)',
} as const;

// Liste des équipements possibles
export const AMENITIES = [
  'WiFi',
  'Parking',
  'Machine à laver',
  'Sèche-linge',
  'Cuisine équipée',
  'Lave-vaisselle',
  'Télévision',
  'Climatisation',
  'Chauffage',
  'Jardin',
  'Terrasse',
  'Barbecue',
  'Piscine',
  'Draps fournis',
  'Serviettes fournies',
  'Fer à repasser',
  'Micro-ondes',
  'Congélateur',
  'Accès PMR',
  'Garage',
] as const;

// Données des 19 centrales nucléaires
export const NUCLEAR_PLANTS = [
  {
    name: 'Belleville-sur-Loire',
    city: 'Belleville-sur-Loire',
    department: 'Cher',
    region: 'Centre-Val de Loire',
    latitude: 47.5136,
    longitude: 2.8753,
    reactorCount: 2,
    description: 'Centrale nucléaire située sur les bords de la Loire dans le Cher.',
  },
  {
    name: 'Blayais',
    city: 'Braud-et-Saint-Louis',
    department: 'Gironde',
    region: 'Nouvelle-Aquitaine',
    latitude: 45.2564,
    longitude: -0.6914,
    reactorCount: 4,
    description: "Centrale nucléaire située sur l'estuaire de la Gironde.",
  },
  {
    name: 'Bugey',
    city: 'Saint-Vulbas',
    department: 'Ain',
    region: 'Auvergne-Rhône-Alpes',
    latitude: 45.7983,
    longitude: 5.2706,
    reactorCount: 4,
    description: "Centrale nucléaire située dans l'Ain, près de Lyon.",
  },
  {
    name: 'Cattenom',
    city: 'Cattenom',
    department: 'Moselle',
    region: 'Grand Est',
    latitude: 49.4069,
    longitude: 6.2192,
    reactorCount: 4,
    description: 'Centrale nucléaire située en Moselle, près du Luxembourg.',
  },
  {
    name: 'Chinon',
    city: 'Avoine',
    department: 'Indre-et-Loire',
    region: 'Centre-Val de Loire',
    latitude: 47.2303,
    longitude: 0.1692,
    reactorCount: 4,
    description: 'Centrale nucléaire historique située en bord de Loire.',
  },
  {
    name: 'Chooz',
    city: 'Chooz',
    department: 'Ardennes',
    region: 'Grand Est',
    latitude: 50.0908,
    longitude: 4.7906,
    reactorCount: 2,
    description: 'Centrale nucléaire située dans les Ardennes, à la frontière belge.',
  },
  {
    name: 'Civaux',
    city: 'Civaux',
    department: 'Vienne',
    region: 'Nouvelle-Aquitaine',
    latitude: 46.4453,
    longitude: 0.6536,
    reactorCount: 2,
    description: 'Centrale nucléaire la plus récente du parc français (hors EPR).',
  },
  {
    name: 'Cruas-Meysse',
    city: 'Cruas',
    department: 'Ardèche',
    region: 'Auvergne-Rhône-Alpes',
    latitude: 44.6333,
    longitude: 4.7567,
    reactorCount: 4,
    description: "Centrale nucléaire située dans la vallée du Rhône en Ardèche.",
  },
  {
    name: 'Dampierre-en-Burly',
    city: 'Dampierre-en-Burly',
    department: 'Loiret',
    region: 'Centre-Val de Loire',
    latitude: 47.7314,
    longitude: 2.5175,
    reactorCount: 4,
    description: 'Centrale nucléaire située dans le Loiret, en bord de Loire.',
  },
  {
    name: 'Flamanville',
    city: 'Flamanville',
    department: 'Manche',
    region: 'Normandie',
    latitude: 49.5375,
    longitude: -1.8814,
    reactorCount: 2,
    description: 'Centrale nucléaire située sur la côte du Cotentin.',
  },
  {
    name: 'Golfech',
    city: 'Golfech',
    department: 'Tarn-et-Garonne',
    region: 'Occitanie',
    latitude: 44.1064,
    longitude: 0.8453,
    reactorCount: 2,
    description: 'Centrale nucléaire située en bord de Garonne.',
  },
  {
    name: 'Gravelines',
    city: 'Gravelines',
    department: 'Nord',
    region: 'Hauts-de-France',
    latitude: 51.0153,
    longitude: 2.1075,
    reactorCount: 6,
    description: "La plus grande centrale nucléaire d'Europe de l'Ouest.",
  },
  {
    name: 'Nogent-sur-Seine',
    city: 'Nogent-sur-Seine',
    department: 'Aube',
    region: 'Grand Est',
    latitude: 48.5178,
    longitude: 3.5208,
    reactorCount: 2,
    description: 'Centrale nucléaire la plus proche de Paris.',
  },
  {
    name: 'Paluel',
    city: 'Paluel',
    department: 'Seine-Maritime',
    region: 'Normandie',
    latitude: 49.8589,
    longitude: 0.6308,
    reactorCount: 4,
    description: 'Centrale nucléaire située sur la côte normande.',
  },
  {
    name: 'Penly',
    city: 'Penly',
    department: 'Seine-Maritime',
    region: 'Normandie',
    latitude: 49.9764,
    longitude: 1.2103,
    reactorCount: 2,
    description: 'Centrale nucléaire située près de Dieppe.',
  },
  {
    name: 'Saint-Alban-du-Rhône',
    city: 'Saint-Alban-du-Rhône',
    department: 'Isère',
    region: 'Auvergne-Rhône-Alpes',
    latitude: 45.4069,
    longitude: 4.7544,
    reactorCount: 2,
    description: 'Centrale nucléaire située dans la vallée du Rhône en Isère.',
  },
  {
    name: 'Saint-Laurent-des-Eaux',
    city: 'Saint-Laurent-Nouan',
    department: 'Loir-et-Cher',
    region: 'Centre-Val de Loire',
    latitude: 47.7208,
    longitude: 1.5783,
    reactorCount: 2,
    description: 'Centrale nucléaire située en bord de Loire dans le Loir-et-Cher.',
  },
  {
    name: 'Tricastin',
    city: 'Saint-Paul-Trois-Châteaux',
    department: 'Drôme',
    region: 'Auvergne-Rhône-Alpes',
    latitude: 44.3325,
    longitude: 4.7319,
    reactorCount: 4,
    description: 'Centrale nucléaire du site nucléaire du Tricastin dans la Drôme.',
  },
  {
    name: 'EPR Flamanville 3',
    city: 'Flamanville',
    department: 'Manche',
    region: 'Normandie',
    latitude: 49.5375,
    longitude: -1.8814,
    reactorCount: 1,
    description: "Réacteur EPR de nouvelle génération, le plus puissant de France.",
  },
] as const;

// Formule de calcul de distance (Haversine)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Arrondi à 1 décimale
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calcul du montant de la commission plateforme (côté locataire)
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENT) / 100;
}

// Calcul de la commission propriétaire (10% prélevés sur le montant de la réservation)
export function calculateOwnerCommission(amount: number): number {
  return Math.round(amount * OWNER_COMMISSION_PERCENT) / 100;
}

// Calcul du montant net reçu par le propriétaire après commission
export function calculateOwnerPayout(amount: number): number {
  return amount - calculateOwnerCommission(amount);
}

// Calcul du dépôt de garantie pour paiement espèces
export function calculateCashDeposit(weeklyPrice: number): number {
  const commission = calculatePlatformFee(weeklyPrice);
  return commission + CASH_SECURITY_DEPOSIT_EUR;
}

// Convertir un montant en euros vers les centimes Stripe
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

// Convertir des centimes Stripe en euros
export function centsToEuros(cents: number): number {
  return cents / 100;
}

// Formater un prix en euros
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Formater une date en français
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

// Formater une date courte
export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
