import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, requireActiveSubscription } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createListingSchema, updateListingSchema, updateAvailabilitySchema } from '@gites/shared';
import { calculateDistance } from '@gites/shared';
import { cloudinaryService } from '../services/cloudinary';
import { uploadPhotos } from '../middleware/upload';

const router = Router();

// GET /api/listings/owner/my-listings — Logements du propriétaire connecté
// IMPORTANT: Cette route DOIT être AVANT /:id pour éviter que "owner" soit matché comme un :id
router.get('/owner/my-listings', authenticate, requireRole('OWNER'), async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { ownerId: req.userId },
      include: {
        nuclearPlant: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const listingsWithStats = listings.map((listing) => {
      const ratings = listing.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;
      return {
        ...listing,
        pricePerWeek: Number(listing.pricePerWeek),
        rating: avgRating,
        reviewCount: listing.reviews.length,
        bookingsCount: listing._count.bookings,
      };
    });

    res.json({ listings: listingsWithStats });
  } catch (error) {
    console.error('Erreur récupération mes logements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos logements' });
  }
});

// POST /api/listings — Créer un logement (propriétaire avec abonnement actif)
router.post(
  '/',
  authenticate,
  requireRole('OWNER'),
  requireActiveSubscription,
  validate(createListingSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;

      // Récupérer la centrale pour calculer la distance
      const plant = await prisma.nuclearPlant.findUnique({
        where: { id: data.nuclearPlantId },
      });

      if (!plant) {
        res.status(404).json({ error: 'Centrale nucléaire non trouvée' });
        return;
      }

      const distanceToPlant = calculateDistance(
        data.latitude,
        data.longitude,
        plant.latitude,
        plant.longitude,
      );

      const listing = await prisma.listing.create({
        data: {
          ...data,
          ownerId: req.userId!,
          distanceToPlant,
          isVerified: false, // Doit être validé par l'admin
        },
        include: {
          nuclearPlant: { select: { id: true, name: true } },
          owner: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
          },
        },
      });

      res.status(201).json({ listing });
    } catch (error) {
      console.error('Erreur création logement:', error);
      res.status(500).json({ error: 'Erreur lors de la création du logement' });
    }
  },
);

// GET /api/listings/:id — Détail d'un logement
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        nuclearPlant: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true,
            createdAt: true,
          },
        },
        reviews: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        availabilities: {
          where: { endDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!listing) {
      res.status(404).json({ error: 'Logement non trouvé' });
      return;
    }

    // Calculer la note moyenne
    const ratings = listing.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

    res.json({
      listing: {
        ...listing,
        pricePerWeek: Number(listing.pricePerWeek),
        rating: avgRating,
        reviewCount: listing.reviews.length,
      },
    });
  } catch (error) {
    console.error('Erreur détail logement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du logement' });
  }
});

// PUT /api/listings/:id — Modifier un logement (propriétaire uniquement)
router.put(
  '/:id',
  authenticate,
  requireRole('OWNER'),
  validate(updateListingSchema),
  async (req: Request, res: Response) => {
    try {
      // Vérifier que le logement appartient au propriétaire
      const existing = await prisma.listing.findFirst({
        where: { id: req.params.id, ownerId: req.userId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Logement non trouvé ou non autorisé' });
        return;
      }

      const data = req.body;

      // Recalculer la distance si les coordonnées changent
      let distanceToPlant = existing.distanceToPlant;
      if (data.latitude && data.longitude) {
        const plant = await prisma.nuclearPlant.findUnique({
          where: { id: data.nuclearPlantId || existing.nuclearPlantId },
        });
        if (plant) {
          distanceToPlant = calculateDistance(data.latitude, data.longitude, plant.latitude, plant.longitude);
        }
      }

      const listing = await prisma.listing.update({
        where: { id: req.params.id },
        data: { ...data, distanceToPlant },
        include: {
          nuclearPlant: { select: { id: true, name: true } },
        },
      });

      res.json({ listing });
    } catch (error) {
      console.error('Erreur modification logement:', error);
      res.status(500).json({ error: 'Erreur lors de la modification du logement' });
    }
  },
);

// DELETE /api/listings/:id — Supprimer un logement
router.delete('/:id', authenticate, requireRole('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id: req.params.id,
        ...(req.userRole !== 'ADMIN' ? { ownerId: req.userId } : {}),
      },
    });

    if (!listing) {
      res.status(404).json({ error: 'Logement non trouvé ou non autorisé' });
      return;
    }

    // Vérifier qu'il n'y a pas de réservation active
    const activeBookings = await prisma.booking.count({
      where: {
        listingId: req.params.id,
        status: { in: ['CONFIRMED', 'ACTIVE'] },
      },
    });

    if (activeBookings > 0) {
      res.status(400).json({
        error: 'Impossible de supprimer un logement avec des réservations en cours',
      });
      return;
    }

    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Logement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression logement:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du logement' });
  }
});

// POST /api/listings/:id/photos — Upload de photos
router.post(
  '/:id/photos',
  authenticate,
  requireRole('OWNER'),
  uploadPhotos.array('photos', 10),
  async (req: Request, res: Response) => {
    try {
      const listing = await prisma.listing.findFirst({
        where: { id: req.params.id, ownerId: req.userId },
      });

      if (!listing) {
        res.status(404).json({ error: 'Logement non trouvé ou non autorisé' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Au moins une photo est requise' });
        return;
      }

      // Upload chaque photo sur Cloudinary
      const uploadPromises = files.map((file) =>
        cloudinaryService.uploadImage(file.buffer, `listings/${listing.id}`),
      );
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map((r) => r.url);

      // Ajouter les nouvelles photos aux existantes
      const updatedListing = await prisma.listing.update({
        where: { id: req.params.id },
        data: {
          photos: [...listing.photos, ...newPhotoUrls],
        },
      });

      res.json({ photos: updatedListing.photos });
    } catch (error) {
      console.error('Erreur upload photos:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload des photos' });
    }
  },
);

// GET /api/listings/:id/availability — Disponibilités d'un logement
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const availabilities = await prisma.availability.findMany({
      where: {
        listingId: req.params.id,
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({ availabilities });
  } catch (error) {
    console.error('Erreur récupération disponibilités:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des disponibilités' });
  }
});

// PUT /api/listings/:id/availability — Mettre à jour les disponibilités
router.put(
  '/:id/availability',
  authenticate,
  requireRole('OWNER'),
  validate(updateAvailabilitySchema),
  async (req: Request, res: Response) => {
    try {
      const listing = await prisma.listing.findFirst({
        where: { id: req.params.id, ownerId: req.userId },
      });

      if (!listing) {
        res.status(404).json({ error: 'Logement non trouvé ou non autorisé' });
        return;
      }

      const { availabilities } = req.body;

      // Supprimer les anciennes disponibilités futures
      await prisma.availability.deleteMany({
        where: {
          listingId: req.params.id,
          startDate: { gte: new Date() },
        },
      });

      // Créer les nouvelles disponibilités
      const created = await prisma.availability.createMany({
        data: availabilities.map((a: any) => ({
          listingId: req.params.id,
          startDate: new Date(a.startDate),
          endDate: new Date(a.endDate),
          isAvailable: a.isAvailable,
        })),
      });

      res.json({ message: `${created.count} créneaux mis à jour` });
    } catch (error) {
      console.error('Erreur mise à jour disponibilités:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des disponibilités' });
    }
  },
);

export default router;
