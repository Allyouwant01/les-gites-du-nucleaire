import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/plants — Liste des 19 centrales nucléaires
router.get('/', async (_req: Request, res: Response) => {
  try {
    const plants = await prisma.nuclearPlant.findMany({
      include: {
        _count: {
          select: { listings: { where: { isActive: true, isVerified: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const plantsWithCount = plants.map((plant) => ({
      id: plant.id,
      name: plant.name,
      city: plant.city,
      department: plant.department,
      region: plant.region,
      latitude: plant.latitude,
      longitude: plant.longitude,
      imageUrl: plant.imageUrl,
      description: plant.description,
      reactorCount: plant.reactorCount,
      listingsCount: plant._count.listings,
    }));

    res.json({ plants: plantsWithCount });
  } catch (error) {
    console.error('Erreur récupération centrales:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des centrales' });
  }
});

// GET /api/plants/:id — Détail d'une centrale
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plant = await prisma.nuclearPlant.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { listings: { where: { isActive: true, isVerified: true } } },
        },
      },
    });

    if (!plant) {
      res.status(404).json({ error: 'Centrale non trouvée' });
      return;
    }

    res.json({
      plant: {
        ...plant,
        listingsCount: plant._count.listings,
      },
    });
  } catch (error) {
    console.error('Erreur détail centrale:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la centrale' });
  }
});

// GET /api/plants/:id/listings — Logements proches d'une centrale
router.get('/:id/listings', async (req: Request, res: Response) => {
  try {
    const {
      minPrice,
      maxPrice,
      guests,
      bedrooms,
      amenities,
      sortBy = 'distance',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where: any = {
      nuclearPlantId: req.params.id,
      isActive: true,
      isVerified: true,
    };

    if (minPrice) {
      where.pricePerWeek = { ...where.pricePerWeek, gte: parseFloat(minPrice as string) };
    }
    if (maxPrice) {
      where.pricePerWeek = { ...where.pricePerWeek, lte: parseFloat(maxPrice as string) };
    }
    if (guests) {
      where.maxGuests = { gte: parseInt(guests as string, 10) };
    }
    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms as string, 10) };
    }
    if (amenities) {
      const amenityList = (amenities as string).split(',');
      where.amenities = { hasEvery: amenityList };
    }

    // Déterminer l'ordre de tri
    let orderBy: any = { distanceToPlant: 'asc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { pricePerWeek: 'asc' };
        break;
      case 'price_desc':
        orderBy = { pricePerWeek: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'distance':
      default:
        orderBy = { distanceToPlant: 'asc' };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          nuclearPlant: { select: { id: true, name: true } },
          reviews: { select: { rating: true } },
          owner: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Calculer la note moyenne pour chaque logement
    const listingsWithRating = listings.map((listing) => {
      const ratings = listing.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      return {
        id: listing.id,
        title: listing.title,
        city: listing.city,
        pricePerWeek: Number(listing.pricePerWeek),
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        photos: listing.photos,
        amenities: listing.amenities,
        rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: listing.reviews.length,
        distanceToPlant: listing.distanceToPlant,
        isVerified: listing.isVerified,
        nuclearPlant: listing.nuclearPlant,
        owner: listing.owner,
      };
    });

    res.json({
      listings: listingsWithRating,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Erreur récupération logements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des logements' });
  }
});

export default router;
