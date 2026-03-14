import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '@gites/shared';
import { notificationService } from '../services/notifications';

const router = Router();

// GET /api/reviews/listing/:id — Avis d'un logement
router.get('/listing/:id', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId: req.params.id },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.review.count({ where: { listingId: req.params.id } }),
    ]);

    // Calculer les statistiques de notes
    const allRatings = await prisma.review.findMany({
      where: { listingId: req.params.id },
      select: { rating: true },
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: allRatings.filter((rev) => rev.rating === r).length,
    }));

    const avgRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;

    res.json({
      reviews,
      stats: { avgRating, totalReviews: total, ratingDistribution },
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des avis' });
  }
});

// POST /api/reviews — Créer un avis
router.post('/', authenticate, validate(createReviewSchema), async (req: Request, res: Response) => {
  try {
    const { bookingId, listingId, rating, comment } = req.body;

    // Vérifier que la réservation est terminée et appartient à l'utilisateur
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking || booking.tenantId !== req.userId) {
      res.status(404).json({ error: 'Réservation non trouvée' });
      return;
    }

    if (booking.status !== 'COMPLETED' && booking.status !== 'ACTIVE') {
      res.status(400).json({
        error: 'Vous ne pouvez laisser un avis que pour une réservation terminée ou en cours',
      });
      return;
    }

    // Vérifier qu'un avis n'existe pas déjà
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      res.status(409).json({ error: 'Vous avez déjà laissé un avis pour cette réservation' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        authorId: req.userId!,
        listingId,
        rating,
        comment,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // Notifier le propriétaire
    await notificationService.send({
      userId: booking.listing.ownerId,
      type: 'REVIEW_RECEIVED',
      title: 'Nouvel avis',
      body: `${review.author.firstName} a laissé un avis (${rating}/5) pour "${booking.listing.title}"`,
      data: { reviewId: review.id, listingId, rating },
    });

    res.status(201).json({ review });
  } catch (error) {
    console.error('Erreur création avis:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'avis' });
  }
});

// POST /api/reviews/:id/respond — Répondre à un avis (propriétaire)
router.post('/:id/respond', authenticate, requireRole('OWNER'), async (req: Request, res: Response) => {
  try {
    const { response } = req.body;

    if (!response || response.trim().length < 5) {
      res.status(400).json({ error: 'La réponse doit contenir au moins 5 caractères' });
      return;
    }

    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!review || review.listing.ownerId !== req.userId) {
      res.status(404).json({ error: 'Avis non trouvé ou non autorisé' });
      return;
    }

    if (review.response) {
      res.status(400).json({ error: 'Vous avez déjà répondu à cet avis' });
      return;
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { response: response.trim() },
    });

    res.json({ review: updated });
  } catch (error) {
    console.error('Erreur réponse avis:', error);
    res.status(500).json({ error: 'Erreur lors de la réponse à l\'avis' });
  }
});

export default router;
