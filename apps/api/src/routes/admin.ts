import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { adminVerifyListingSchema } from '@gites/shared';
import { notificationService } from '../services/notifications';

const router = Router();

// GET /api/admin/dashboard — Statistiques admin
router.get('/dashboard', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalListings,
      totalBookings,
      activeSubscriptions,
      pendingListings,
      payments,
      bookingsByPlant,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.ownerSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { isVerified: false, isActive: true } }),
      prisma.payment.findMany({
        where: { status: 'PAID' },
        select: { platformFee: true, paidAt: true },
      }),
      prisma.booking.groupBy({
        by: ['listingId'],
        _count: true,
        where: { status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] } },
      }),
    ]);

    // Calculer le revenu total de la plateforme
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.platformFee), 0);

    // Revenus par mois (12 derniers mois)
    const monthlyRevenue: { month: string; amount: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthPayments = payments.filter(
        (p) => p.paidAt && p.paidAt >= monthDate && p.paidAt < nextMonth,
      );
      const monthAmount = monthPayments.reduce((sum, p) => sum + Number(p.platformFee), 0);
      monthlyRevenue.push({
        month: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        amount: Math.round(monthAmount * 100) / 100,
      });
    }

    // Réservations par centrale
    const listingIds = bookingsByPlant.map((b) => b.listingId);
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, nuclearPlant: { select: { name: true } } },
    });

    const plantBookings: Record<string, number> = {};
    for (const bp of bookingsByPlant) {
      const listing = listings.find((l) => l.id === bp.listingId);
      const plantName = listing?.nuclearPlant?.name || 'Inconnu';
      plantBookings[plantName] = (plantBookings[plantName] || 0) + bp._count;
    }

    const bookingsByPlantFormatted = Object.entries(plantBookings)
      .map(([plantName, count]) => ({ plantName, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      stats: {
        totalUsers,
        totalListings,
        totalBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeSubscriptions,
        pendingListings,
        bookingsByPlant: bookingsByPlantFormatted,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET /api/admin/listings/pending — Logements en attente de validation
router.get('/listings/pending', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { isVerified: false, isActive: true },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isVerified: true,
            verificationDocumentUrl: true,
          },
        },
        nuclearPlant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ listings });
  } catch (error) {
    console.error('Erreur récupération logements en attente:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des logements' });
  }
});

// PUT /api/admin/listings/:id/verify — Approuver ou rejeter un logement
router.put(
  '/listings/:id/verify',
  authenticate,
  requireRole('ADMIN'),
  validate(adminVerifyListingSchema),
  async (req: Request, res: Response) => {
    try {
      const { isVerified, adminComment } = req.body;

      const listing = await prisma.listing.findUnique({
        where: { id: req.params.id },
        include: { owner: true },
      });

      if (!listing) {
        res.status(404).json({ error: 'Logement non trouvé' });
        return;
      }

      await prisma.listing.update({
        where: { id: req.params.id },
        data: {
          isVerified,
          adminComment: adminComment || null,
        },
      });

      // Notifier le propriétaire
      await notificationService.send({
        userId: listing.ownerId,
        type: isVerified ? 'LISTING_VERIFIED' : 'LISTING_REJECTED',
        title: isVerified ? 'Annonce validée' : 'Annonce rejetée',
        body: isVerified
          ? `Votre annonce "${listing.title}" a été validée et est maintenant visible`
          : `Votre annonce "${listing.title}" a été rejetée. ${adminComment || ''}`,
        data: { listingId: listing.id },
      });

      res.json({
        message: isVerified ? 'Logement approuvé' : 'Logement rejeté',
      });
    } catch (error) {
      console.error('Erreur vérification logement:', error);
      res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
  },
);

// GET /api/admin/users — Liste des utilisateurs
router.get('/users', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { role, verified, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = {};
    if (role) where.role = role;
    if (verified !== undefined) where.isVerified = verified === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          verificationDocumentUrl: true,
          createdAt: true,
          _count: { select: { listings: true, bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// PUT /api/admin/users/:id/verify — Vérifier un utilisateur
router.put('/users/:id/verify', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { isVerified } = req.body;

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified },
    });

    res.json({ message: isVerified ? 'Utilisateur vérifié' : 'Vérification retirée' });
  } catch (error) {
    console.error('Erreur vérification utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

export default router;
