import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBookingSchema, splitInviteSchema } from '@gites/shared';
import {
  calculatePlatformFee,
  calculateCashDeposit,
  CASH_SECURITY_DEPOSIT_EUR,
  FREE_CANCELLATION_DAYS,
} from '@gites/shared';
import { stripeService } from '../services/stripe';
import { notificationService } from '../services/notifications';

const router = Router();

// POST /api/bookings — Créer une réservation
router.post('/', authenticate, validate(createBookingSchema), async (req: Request, res: Response) => {
  try {
    const { listingId, checkInDate, checkOutDate, numberOfGuests, paymentMethod } = req.body;

    // Récupérer le logement
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });

    if (!listing || !listing.isActive || !listing.isVerified) {
      res.status(404).json({ error: 'Logement non disponible' });
      return;
    }

    if (numberOfGuests > listing.maxGuests) {
      res.status(400).json({
        error: `Ce logement accueille ${listing.maxGuests} personnes maximum`,
      });
      return;
    }

    // Le propriétaire ne peut pas réserver son propre logement
    if (listing.ownerId === req.userId) {
      res.status(400).json({ error: 'Vous ne pouvez pas réserver votre propre logement' });
      return;
    }

    // Calculer le nombre de semaines
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const numberOfWeeks = Math.ceil(diffDays / 7);

    if (numberOfWeeks < 1) {
      res.status(400).json({ error: 'La durée minimum est d\'une semaine' });
      return;
    }

    // Vérifier la disponibilité
    const overlappingBookings = await prisma.booking.count({
      where: {
        listingId,
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        OR: [
          { checkInDate: { lte: end }, checkOutDate: { gte: start } },
        ],
      },
    });

    if (overlappingBookings > 0) {
      res.status(409).json({ error: 'Ce logement n\'est pas disponible pour ces dates' });
      return;
    }

    const weeklyPrice = Number(listing.pricePerWeek);
    const totalPrice = weeklyPrice * numberOfWeeks;

    // Créer la réservation
    const booking = await prisma.booking.create({
      data: {
        listingId,
        tenantId: req.userId!,
        checkInDate: start,
        checkOutDate: end,
        numberOfGuests,
        totalPrice,
        weeklyPrice,
        numberOfWeeks,
        paymentMethod,
        status: 'PENDING',
      },
    });

    // Générer les échéances de paiement hebdomadaires
    const payments = [];
    for (let week = 1; week <= numberOfWeeks; week++) {
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + (week - 1) * 7);

      payments.push({
        bookingId: booking.id,
        userId: req.userId!,
        amount: weeklyPrice,
        platformFee: calculatePlatformFee(weeklyPrice),
        method: paymentMethod === 'SPLIT' ? 'CARD' as const : paymentMethod as any,
        status: 'PENDING' as const,
        weekNumber: week,
        dueDate,
      });
    }

    await prisma.payment.createMany({ data: payments });

    // Pour paiement espèces : créer le dépôt de garantie
    if (paymentMethod === 'CASH') {
      const depositAmount = calculateCashDeposit(weeklyPrice);
      const user = await prisma.user.findUnique({ where: { id: req.userId } });

      const customerId = await stripeService.getOrCreateCustomer(
        user!.email,
        `${user!.firstName} ${user!.lastName}`,
        user!.stripeCustomerId || undefined,
      );

      if (!user!.stripeCustomerId) {
        await prisma.user.update({
          where: { id: req.userId },
          data: { stripeCustomerId: customerId },
        });
      }

      const depositIntent = await stripeService.createDepositPaymentIntent(
        customerId,
        depositAmount,
        booking.id,
      );

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          depositAmount,
          depositStripeId: depositIntent.id,
        },
      });
    }

    // Notifier le propriétaire
    await notificationService.send({
      userId: listing.ownerId,
      type: 'NEW_BOOKING',
      title: 'Nouvelle réservation',
      body: `Nouvelle demande de réservation pour "${listing.title}"`,
      data: { bookingId: booking.id, listingId: listing.id },
    });

    // Récupérer la réservation complète
    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        listing: {
          include: {
            nuclearPlant: { select: { id: true, name: true } },
          },
        },
        payments: { orderBy: { weekNumber: 'asc' } },
      },
    });

    res.status(201).json({ booking: fullBooking });
  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
  }
});

// GET /api/bookings — Mes réservations
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, role = 'tenant' } = req.query;

    const where: any = {};

    // Le locataire voit ses réservations, le propriétaire celles de ses logements
    if (role === 'owner') {
      where.listing = { ownerId: req.userId };
    } else {
      where.tenantId = req.userId;
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          include: {
            nuclearPlant: { select: { id: true, name: true } },
          },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
        },
        payments: { orderBy: { weekNumber: 'asc' } },
        splitPayments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Erreur récupération réservations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// GET /api/bookings/:id — Détail d'une réservation
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          include: {
            nuclearPlant: { select: { id: true, name: true } },
            owner: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
            },
          },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
        },
        payments: { orderBy: { weekNumber: 'asc' } },
        splitPayments: {
          include: {
            payer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Réservation non trouvée' });
      return;
    }

    // Vérifier l'accès (locataire, propriétaire du logement, ou admin)
    if (
      booking.tenantId !== req.userId &&
      booking.listing.owner.id !== req.userId &&
      req.userRole !== 'ADMIN'
    ) {
      res.status(403).json({ error: 'Accès non autorisé' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    console.error('Erreur détail réservation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la réservation' });
  }
});

// PUT /api/bookings/:id/confirm — Confirmer une réservation (propriétaire)
router.put('/:id/confirm', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!booking || booking.listing.ownerId !== req.userId) {
      res.status(404).json({ error: 'Réservation non trouvée ou non autorisée' });
      return;
    }

    if (booking.status !== 'PENDING') {
      res.status(400).json({ error: 'Cette réservation ne peut pas être confirmée' });
      return;
    }

    await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });

    // Notifier le locataire
    await notificationService.send({
      userId: booking.tenantId,
      type: 'BOOKING_CONFIRMED',
      title: 'Réservation confirmée',
      body: `Votre réservation pour "${booking.listing.title}" a été confirmée !`,
      data: { bookingId: booking.id },
    });

    res.json({ message: 'Réservation confirmée' });
  } catch (error) {
    console.error('Erreur confirmation réservation:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation' });
  }
});

// PUT /api/bookings/:id/cancel — Annuler une réservation
router.put('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: true,
        payments: true,
      },
    });

    if (!booking || (booking.tenantId !== req.userId && req.userRole !== 'ADMIN')) {
      res.status(404).json({ error: 'Réservation non trouvée ou non autorisée' });
      return;
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      res.status(400).json({ error: 'Cette réservation ne peut pas être annulée' });
      return;
    }

    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let cancellationFee = 0;

    if (booking.status === 'ACTIVE') {
      // En cours de séjour : payer la semaine en cours
      const currentWeek = Math.ceil(
        (now.getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24 * 7),
      );
      // La semaine en cours est déjà due, annuler les semaines futures
      await prisma.payment.updateMany({
        where: {
          bookingId: booking.id,
          weekNumber: { gt: currentWeek },
          status: 'PENDING',
        },
        data: { status: 'REFUNDED' },
      });
    } else if (daysUntilCheckIn < FREE_CANCELLATION_DAYS) {
      // Moins de 7 jours : frais d'une semaine
      cancellationFee = Number(booking.weeklyPrice);
    }
    // Plus de 7 jours : annulation gratuite → tous les paiements pending annulés

    // Annuler les paiements en attente (sauf la première semaine si frais)
    if (cancellationFee === 0) {
      await prisma.payment.updateMany({
        where: { bookingId: booking.id, status: 'PENDING' },
        data: { status: 'REFUNDED' },
      });
    } else {
      // Garder la première semaine, annuler le reste
      await prisma.payment.updateMany({
        where: { bookingId: booking.id, status: 'PENDING', weekNumber: { gt: 1 } },
        data: { status: 'REFUNDED' },
      });
    }

    await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    // Rembourser le dépôt si paiement espèces
    if (booking.depositStripeId && !booking.depositRefunded) {
      try {
        await stripeService.refundDeposit(
          booking.depositStripeId,
          CASH_SECURITY_DEPOSIT_EUR,
        );
        await prisma.booking.update({
          where: { id: req.params.id },
          data: { depositRefunded: true },
        });
      } catch (refundError) {
        console.error('Erreur remboursement dépôt:', refundError);
      }
    }

    // Notifier le propriétaire
    await notificationService.send({
      userId: booking.listing.ownerId,
      type: 'BOOKING_CANCELLED',
      title: 'Réservation annulée',
      body: `La réservation pour "${booking.listing.title}" a été annulée`,
      data: { bookingId: booking.id },
    });

    res.json({
      message: 'Réservation annulée',
      cancellationFee,
    });
  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

// POST /api/bookings/:id/split-invite — Inviter des colocataires pour paiement partagé
router.post(
  '/:id/split-invite',
  authenticate,
  validate(splitInviteSchema),
  async (req: Request, res: Response) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: { listing: true },
      });

      if (!booking || booking.tenantId !== req.userId) {
        res.status(404).json({ error: 'Réservation non trouvée ou non autorisée' });
        return;
      }

      if (booking.paymentMethod !== 'SPLIT') {
        res.status(400).json({ error: 'Cette réservation n\'utilise pas le paiement partagé' });
        return;
      }

      const { invites } = req.body;

      // Créer les invitations de paiement partagé pour chaque semaine
      const splitPayments = [];
      for (let week = 1; week <= booking.numberOfWeeks; week++) {
        for (const invite of invites) {
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await prisma.user.findUnique({
            where: { email: invite.email },
          });

          splitPayments.push({
            bookingId: booking.id,
            payerId: existingUser?.id || null,
            payerEmail: invite.email,
            payerName: invite.name,
            amount: invite.amount,
            weekNumber: week,
          });
        }
      }

      await prisma.splitPayment.createMany({ data: splitPayments });

      // Récupérer les split payments créés pour envoyer les notifications
      const createdSplits = await prisma.splitPayment.findMany({
        where: { bookingId: booking.id },
      });

      // Notifier les colocataires qui ont un compte
      for (const split of createdSplits) {
        if (split.payerId && split.weekNumber === 1) {
          await notificationService.send({
            userId: split.payerId,
            type: 'SPLIT_INVITE',
            title: 'Invitation paiement partagé',
            body: `Vous êtes invité à partager le logement "${booking.listing.title}". Votre part : ${split.amount}€/semaine`,
            data: {
              bookingId: booking.id,
              splitPaymentId: split.id,
              inviteToken: split.inviteToken,
            },
          });
        }
      }

      res.json({
        message: 'Invitations envoyées',
        splitPayments: createdSplits.filter((s) => s.weekNumber === 1),
      });
    } catch (error) {
      console.error('Erreur invitation split:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi des invitations' });
    }
  },
);

export default router;
