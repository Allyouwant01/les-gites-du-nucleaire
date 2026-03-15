import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================
// HELPERS
// ============================================================

function unsplashUrl(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=800&q=80`;
}

// All IDs verified 200 OK on 2026-03-15
const HOUSE_IDS = [
  '1568605114967-8130f3a36994',
  '1600596542815-ffad4c1539a9',
  '1600585154340-be6161a56a0c',
  '1564013799919-ab600027ffc6',
  '1582268611958-ebfd161ef9cf',
  '1502672260266-1c1ef2d93688',
  '1600607687939-ce8a6c25118c',
  '1600607687920-4e2a09cf159d',
  '1600573472550-8090b5e0745e',
  '1600047509807-ba8f99d2cdde',
  '1571939228382-b2f2b585ce15',
  '1576941089067-2de3c901e126',
  '1512917774080-9991f1c4c750',
  '1570129477492-45c003edd2be',
  '1605276374104-dee2a0ed3cd6',
];

// All IDs verified 200 OK on 2026-03-15
const INTERIOR_IDS = [
  '1522708323590-d24dbb6b0267',
  '1586105449897-20b5efeb3233',
  '1502672023488-70e25813eb80',
  '1556909114-f6e7ad7d3136',
  '1560185127-6ed189bf02f4',
  '1560448075-cbc16bb4af8e',
  '1600566753086-00f18fb6b3ea',
  '1600566752355-35792bedcfea',
];

function getPhotos(index: number): string[] {
  const h1 = HOUSE_IDS[index % HOUSE_IDS.length];
  const h2 = HOUSE_IDS[(index + 1) % HOUSE_IDS.length];
  const h3 = HOUSE_IDS[(index + 2) % HOUSE_IDS.length];
  const i1 = INTERIOR_IDS[index % INTERIOR_IDS.length];
  const i2 = INTERIOR_IDS[(index + 1) % INTERIOR_IDS.length];
  return [unsplashUrl(h1), unsplashUrl(h2), unsplashUrl(i1), unsplashUrl(i2), unsplashUrl(h3)];
}

const ALL_AMENITIES = [
  'WiFi', 'Parking', 'Machine à laver', 'Cuisine équipée', 'Télévision',
  'Chauffage', 'Draps fournis', 'Serviettes fournies', 'Jardin', 'Terrasse',
];

function pickAmenities(index: number): string[] {
  const count = 5 + (index % 4); // 5-8 amenities
  const start = index % ALL_AMENITIES.length;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(ALL_AMENITIES[(start + i) % ALL_AMENITIES.length]);
  }
  return Array.from(new Set(result));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ============================================================
// NUCLEAR PLANTS DATA
// ============================================================

interface PlantData {
  name: string;
  city: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
  reactorCount: number;
}

const PLANTS: PlantData[] = [
  { name: 'Gravelines', city: 'Gravelines', department: 'Nord', region: 'Hauts-de-France', latitude: 51.0153, longitude: 2.1075, reactorCount: 6 },
  { name: 'Dampierre-en-Burly', city: 'Dampierre-en-Burly', department: 'Loiret', region: 'Centre-Val de Loire', latitude: 47.7314, longitude: 2.5175, reactorCount: 4 },
  { name: 'Saint-Laurent-des-Eaux', city: 'Saint-Laurent-des-Eaux', department: 'Loir-et-Cher', region: 'Centre-Val de Loire', latitude: 47.7208, longitude: 1.5783, reactorCount: 2 },
  { name: 'Chinon', city: 'Chinon', department: 'Indre-et-Loire', region: 'Centre-Val de Loire', latitude: 47.2303, longitude: 0.1692, reactorCount: 4 },
  { name: 'Blayais', city: 'Blaye', department: 'Gironde', region: 'Nouvelle-Aquitaine', latitude: 45.2564, longitude: -0.6914, reactorCount: 4 },
  { name: 'Tricastin', city: 'Pierrelatte', department: 'Drôme', region: 'Auvergne-Rhône-Alpes', latitude: 44.3325, longitude: 4.7319, reactorCount: 4 },
  { name: 'Cruas-Meysse', city: 'Cruas', department: 'Ardèche', region: 'Auvergne-Rhône-Alpes', latitude: 44.6333, longitude: 4.7567, reactorCount: 4 },
  { name: 'Bugey', city: 'Saint-Vulbas', department: 'Ain', region: 'Auvergne-Rhône-Alpes', latitude: 45.7983, longitude: 5.2706, reactorCount: 4 },
  { name: 'Paluel', city: 'Paluel', department: 'Seine-Maritime', region: 'Normandie', latitude: 49.8589, longitude: 0.6308, reactorCount: 4 },
  { name: 'Flamanville', city: 'Flamanville', department: 'Manche', region: 'Normandie', latitude: 49.5375, longitude: -1.8814, reactorCount: 2 },
  { name: 'Penly', city: 'Penly', department: 'Seine-Maritime', region: 'Normandie', latitude: 49.9764, longitude: 1.2103, reactorCount: 2 },
  { name: 'Cattenom', city: 'Cattenom', department: 'Moselle', region: 'Grand Est', latitude: 49.4069, longitude: 6.2192, reactorCount: 4 },
  { name: 'Belleville-sur-Loire', city: 'Belleville-sur-Loire', department: 'Cher', region: 'Centre-Val de Loire', latitude: 47.5136, longitude: 2.8753, reactorCount: 2 },
  { name: 'Nogent-sur-Seine', city: 'Nogent-sur-Seine', department: 'Aube', region: 'Grand Est', latitude: 48.5178, longitude: 3.5208, reactorCount: 2 },
  { name: 'Saint-Alban-du-Rhône', city: 'Saint-Alban-du-Rhône', department: 'Isère', region: 'Auvergne-Rhône-Alpes', latitude: 45.4069, longitude: 4.7544, reactorCount: 2 },
  { name: 'Golfech', city: 'Golfech', department: 'Tarn-et-Garonne', region: 'Occitanie', latitude: 44.1064, longitude: 0.8453, reactorCount: 2 },
  { name: 'Chooz', city: 'Chooz', department: 'Ardennes', region: 'Grand Est', latitude: 50.0908, longitude: 4.7906, reactorCount: 2 },
  { name: 'Civaux', city: 'Civaux', department: 'Vienne', region: 'Nouvelle-Aquitaine', latitude: 46.4453, longitude: 0.6536, reactorCount: 2 },
];

// ============================================================
// LISTING TEMPLATES (per plant: 3 listings)
// ============================================================

interface ListingTemplate {
  titleTemplate: string;
  descTemplate: string;
  pricePerWeek: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  distance: number;
  streetTemplate: string;
}

const LISTING_TEMPLATES: ListingTemplate[] = [
  {
    titleTemplate: 'Maison spacieuse à 5 min de la centrale de {plant}',
    descTemplate: 'Grande maison entièrement meublée idéale pour les travailleurs en mission à la centrale de {plant}. Cuisine équipée, parking privé et jardin clos. Située à seulement {dist} km de la centrale.',
    pricePerWeek: 420,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    distance: 3.5,
    streetTemplate: '12 Rue des Chênes',
  },
  {
    titleTemplate: 'Appartement T3 rénové proche {plant}',
    descTemplate: 'Bel appartement T3 récemment rénové, lumineux et fonctionnel. Parfait pour une équipe de 2-3 personnes en déplacement à la centrale de {plant}. Tout confort avec WiFi haut débit.',
    pricePerWeek: 310,
    maxGuests: 3,
    bedrooms: 2,
    bathrooms: 1,
    distance: 6.2,
    streetTemplate: '45 Avenue de la République',
  },
  {
    titleTemplate: 'Gîte tout confort pour équipe nucléaire - {plant}',
    descTemplate: 'Gîte chaleureux pouvant accueillir jusqu\'à 4 personnes, spécialement aménagé pour les missions longue durée. Draps et serviettes fournis, machine à laver, terrasse agréable. À {dist} km de la centrale de {plant}.',
    pricePerWeek: 370,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    distance: 8.0,
    streetTemplate: '8 Impasse du Moulin',
  },
];

// Vary street names
const STREETS = [
  '12 Rue des Chênes', '45 Avenue de la République', '8 Impasse du Moulin',
  '3 Rue Victor Hugo', '27 Boulevard Pasteur', '15 Rue de la Gare',
  '9 Place de l\'Église', '22 Rue Jean Jaurès', '6 Allée des Tilleuls',
  '18 Chemin des Vignes', '34 Rue du Commerce', '11 Rue Gambetta',
  '7 Rue de la Liberté', '29 Rue des Lilas', '40 Avenue Foch',
  '5 Rue du Maréchal Leclerc', '16 Rue de Verdun', '21 Rue Pasteur',
];

// Postal codes per department
const POSTAL_CODES: Record<string, string> = {
  'Nord': '59820',
  'Loiret': '45570',
  'Loir-et-Cher': '41220',
  'Indre-et-Loire': '37500',
  'Gironde': '33390',
  'Drôme': '26700',
  'Ardèche': '07350',
  'Ain': '01150',
  'Seine-Maritime': '76450',
  'Manche': '50340',
  'Moselle': '57570',
  'Cher': '18240',
  'Aube': '10400',
  'Isère': '38370',
  'Tarn-et-Garonne': '82400',
  'Ardennes': '08600',
  'Vienne': '86320',
};

// Price variations
const PRICE_OFFSETS = [0, -60, 30, -20, 50, -40, 10, -30, 40, 20, -10, 60, -50, 35, 25, -15, 45, -25];

// Review comments
const REVIEW_COMMENTS = [
  { rating: 5, comment: 'Très bon logement, propre et bien situé par rapport à la centrale. Je recommande vivement.' },
  { rating: 4, comment: 'Appartement fonctionnel et bien équipé. Idéal pour les missions courtes. Petit bémol sur le parking.' },
  { rating: 5, comment: 'Parfait pour le déplacement ! Propriétaire très réactif et logement impeccable.' },
  { rating: 4, comment: 'Bon rapport qualité-prix. Logement confortable avec tout le nécessaire pour travailler sereinement.' },
  { rating: 3, comment: 'Logement correct mais un peu vieillissant. Emplacement pratique près de la centrale.' },
  { rating: 5, comment: 'Excellent gîte, on s\'y sent comme à la maison. Cuisine très bien équipée.' },
  { rating: 4, comment: 'Séjour agréable, logement conforme à la description. WiFi stable pour le télétravail.' },
  { rating: 5, comment: 'Top ! Deuxième séjour ici et toujours aussi satisfait. Propriétaire aux petits soins.' },
  { rating: 3, comment: 'Correct dans l\'ensemble. La literie mériterait d\'être renouvelée mais emplacement idéal.' },
  { rating: 4, comment: 'Bien situé à quelques minutes de la centrale. Logement propre et calme.' },
];

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
  console.log('🌱 Début du seed...');

  // Clear all data in correct order
  console.log('🗑️  Nettoyage de la base de données...');
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationUser.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.splitPayment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.nuclearPlant.deleteMany();
  await prisma.ownerSubscription.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================
  // 1. USERS
  // ============================================================
  console.log('👤 Création des utilisateurs...');
  const hashedPassword = await bcrypt.hash('test123', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'proprietaire@test.fr',
      passwordHash: hashedPassword,
      firstName: 'Jean-Pierre',
      lastName: 'Martin',
      role: 'OWNER',
      isVerified: true,
      emailVerified: true,
      phone: '+33612345678',
    },
  });

  const tenant = await prisma.user.create({
    data: {
      email: 'locataire@test.fr',
      passwordHash: hashedPassword,
      firstName: 'Thomas',
      lastName: 'Durand',
      role: 'TENANT',
      isVerified: true,
      emailVerified: true,
      phone: '+33698765432',
    },
  });

  console.log(`   Owner: ${owner.id} (${owner.email})`);
  console.log(`   Tenant: ${tenant.id} (${tenant.email})`);

  // ============================================================
  // 2. NUCLEAR PLANTS
  // ============================================================
  console.log('☢️  Création des centrales nucléaires...');
  const createdPlants: Array<{ id: string } & PlantData> = [];

  for (const plant of PLANTS) {
    const created = await prisma.nuclearPlant.create({
      data: {
        name: plant.name,
        city: plant.city,
        department: plant.department,
        region: plant.region,
        latitude: plant.latitude,
        longitude: plant.longitude,
        reactorCount: plant.reactorCount,
        description: `Centrale nucléaire de ${plant.name}, située à ${plant.city} dans le département ${plant.department} (${plant.region}). ${plant.reactorCount} réacteurs en service.`,
      },
    });
    createdPlants.push({ ...plant, id: created.id });
  }

  console.log(`   ${createdPlants.length} centrales créées`);

  // ============================================================
  // 3. LISTINGS (3 per plant = 54 total)
  // ============================================================
  console.log('🏠 Création des logements...');
  const allListings: Array<{ id: string; plantIndex: number; templateIndex: number }> = [];
  let listingIndex = 0;

  for (let pi = 0; pi < createdPlants.length; pi++) {
    const plant = createdPlants[pi];

    for (let ti = 0; ti < 3; ti++) {
      const template = LISTING_TEMPLATES[ti];
      const priceOffset = PRICE_OFFSETS[pi % PRICE_OFFSETS.length] * (ti === 0 ? 1 : ti === 1 ? 0.7 : 0.85);
      const price = Math.round(template.pricePerWeek + priceOffset);
      const distance = +(template.distance + (pi % 5) * 0.8 - (ti % 3) * 1.2).toFixed(1);
      const actualDistance = Math.max(1.5, Math.min(12, distance));

      // Offset lat/lng slightly from plant
      const latOffset = ((pi * 3 + ti) % 7 - 3) * 0.02;
      const lngOffset = ((pi * 3 + ti + 2) % 7 - 3) * 0.015;

      const streetIndex = (pi * 3 + ti) % STREETS.length;

      const listing = await prisma.listing.create({
        data: {
          title: template.titleTemplate.replace('{plant}', plant.name),
          description: template.descTemplate
            .replace(/\{plant\}/g, plant.name)
            .replace(/\{dist\}/g, actualDistance.toString()),
          address: STREETS[streetIndex],
          city: plant.city,
          postalCode: POSTAL_CODES[plant.department] || '75000',
          latitude: plant.latitude + latOffset,
          longitude: plant.longitude + lngOffset,
          pricePerWeek: price,
          maxGuests: template.maxGuests,
          bedrooms: template.bedrooms,
          bathrooms: template.bathrooms,
          amenities: pickAmenities(listingIndex),
          photos: getPhotos(listingIndex),
          isActive: true,
          isVerified: true,
          distanceToPlant: actualDistance,
          ownerId: owner.id,
          nuclearPlantId: plant.id,
          houseRules: 'Non-fumeur. Animaux non acceptés. Respect du voisinage après 22h.',
        },
      });

      allListings.push({ id: listing.id, plantIndex: pi, templateIndex: ti });
      listingIndex++;
    }
  }

  console.log(`   ${allListings.length} logements créés`);

  // ============================================================
  // 4. AVAILABILITIES (8 weeks per listing)
  // ============================================================
  console.log('📅 Création des disponibilités...');
  const today = new Date('2026-03-13');
  let availCount = 0;

  for (const listing of allListings) {
    for (let week = 0; week < 8; week++) {
      const startDate = addDays(today, week * 7);
      const endDate = addDays(today, (week + 1) * 7);

      // Determine availability pattern
      let isAvailable: boolean;
      if (week < 2) {
        // Weeks 1-2: mostly available
        isAvailable = (listing.plantIndex + listing.templateIndex + week) % 5 !== 0;
      } else if (week < 4) {
        // Weeks 3-4: some unavailable
        isAvailable = (listing.plantIndex + week) % 3 !== 0;
      } else {
        // Weeks 5-8: mixed
        isAvailable = (listing.plantIndex + listing.templateIndex + week) % 2 === 0;
      }

      await prisma.availability.create({
        data: {
          listingId: listing.id,
          startDate,
          endDate,
          isAvailable,
        },
      });
      availCount++;
    }
  }

  console.log(`   ${availCount} créneaux de disponibilité créés`);

  // ============================================================
  // 5. REVIEWS (2-3 per listing, each needs a unique booking)
  // ============================================================
  console.log('⭐ Création des avis...');
  let reviewCount = 0;
  let reviewBookingIndex = 0;

  for (const listing of allListings) {
    const numReviews = 2 + ((listing.plantIndex + listing.templateIndex) % 2); // 2 or 3

    for (let r = 0; r < numReviews; r++) {
      const reviewData = REVIEW_COMMENTS[(reviewBookingIndex) % REVIEW_COMMENTS.length];

      // Create a completed booking for this review
      const weeksAgo = 4 + r * 2 + (listing.plantIndex % 3);
      const checkIn = addDays(today, -weeksAgo * 7);
      const checkOut = addDays(checkIn, 7);
      const weeklyPrice = 300 + (reviewBookingIndex % 5) * 20;

      const reviewBooking = await prisma.booking.create({
        data: {
          listingId: listing.id,
          tenantId: tenant.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: 1 + (reviewBookingIndex % 3),
          totalPrice: weeklyPrice,
          weeklyPrice: weeklyPrice,
          numberOfWeeks: 1,
          status: 'COMPLETED',
          paymentMethod: 'CARD',
        },
      });

      await prisma.review.create({
        data: {
          bookingId: reviewBooking.id,
          authorId: tenant.id,
          listingId: listing.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: addDays(checkOut, 1 + (r % 3)),
        },
      });

      reviewCount++;
      reviewBookingIndex++;
    }
  }

  console.log(`   ${reviewCount} avis créés`);

  // ============================================================
  // 6. DEMO BOOKING (active, with payments)
  // ============================================================
  console.log('📋 Création de la réservation démo...');
  const demoListing = allListings[0];
  const weeklyPrice = 420;
  const numberOfWeeks = 4;
  const totalPrice = weeklyPrice * numberOfWeeks;

  const demoBooking = await prisma.booking.create({
    data: {
      listingId: demoListing.id,
      tenantId: tenant.id,
      checkInDate: addDays(today, -14), // Started 2 weeks ago
      checkOutDate: addDays(today, 14), // Ends in 2 weeks
      numberOfGuests: 2,
      totalPrice: totalPrice,
      weeklyPrice: weeklyPrice,
      numberOfWeeks: numberOfWeeks,
      status: 'ACTIVE',
      paymentMethod: 'CARD',
    },
  });

  // 4 weekly payments: 2 PAID, 1 PENDING (current), 1 future PENDING
  const paymentStatuses: Array<{ status: 'PAID' | 'PENDING'; paidAt: Date | null }> = [
    { status: 'PAID', paidAt: addDays(today, -14) },
    { status: 'PAID', paidAt: addDays(today, -7) },
    { status: 'PENDING', paidAt: null },
    { status: 'PENDING', paidAt: null },
  ];

  for (let i = 0; i < paymentStatuses.length; i++) {
    const ps = paymentStatuses[i];
    await prisma.payment.create({
      data: {
        bookingId: demoBooking.id,
        userId: tenant.id,
        amount: weeklyPrice,
        platformFee: 5,
        method: 'CARD',
        status: ps.status,
        weekNumber: i + 1,
        dueDate: addDays(today, -14 + i * 7),
        paidAt: ps.paidAt,
      },
    });
  }

  console.log(`   Réservation démo créée (${demoBooking.id}) avec 4 paiements`);

  // ============================================================
  // DONE
  // ============================================================
  console.log('');
  console.log('✅ Seed terminé avec succès !');
  console.log(`   - 2 utilisateurs (owner + tenant)`);
  console.log(`   - ${createdPlants.length} centrales nucléaires`);
  console.log(`   - ${allListings.length} logements`);
  console.log(`   - ${availCount} disponibilités`);
  console.log(`   - ${reviewCount} avis`);
  console.log(`   - 1 réservation active avec 4 paiements`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
