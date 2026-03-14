import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { cashConfirmSchema } from '@gites/shared';
import { stripeService } from '../services/stripe';
import { notificationService } from '../services/notifications';
import { CASH_SECURITY_DEPOSIT_EUR, calculatePlatformFee, calculateOwnerCommission } from '@gites/shared';

const router = Router();

// POST /api/payments/weekly — Paiement hebdomadaire par carte (Stripe)
router.post('/weekly', authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: { listing: { include: { owner: true } } },
        },
        user: true,
      },
    });

    if (!payment || payment.userId !== req.userId) {
      res.status(404).json({ error: 'Paiement non trouvé' });
      return;
    }

    if (payment.status === 'PAID') {
      res.status(400).json({ error: 'Ce paiement a déjà été effectué' });
      return;
    }

    // Obtenir ou créer le client Stripe
    const customerId = await stripeService.getOrCreateCustomer(
      payment.user.email,
      `${payment.user.firstName} ${payment.user.lastName}`,
      payment.user.stripeCustomerId || undefined,
    );

    if (!payment.user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Créer le PaymentIntent Stripe
    const paymentIntent = await stripeService.createWeeklyPaymentIntent(
      customerId,
      Number(payment.amount),
      payment.bookingId,
      payment.weekNumber,
    );

    // Mettre à jour le paiement avec l'ID Stripe
    await prisma.payment.update({
      where: { id: paymentId },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Erreur paiement hebdomadaire:', error);
    res.status(500).json({ error: 'Erreur lors du paiement' });
  }
});

// POST /api/payments/confirm-card — Confirmer un paiement carte après Stripe
router.post('/confirm-card', authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    // Vérifier le statut du PaymentIntent côté Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      res.status(400).json({ error: 'Le paiement n\'a pas été confirmé par Stripe' });
      return;
    }

    // Trouver et mettre à jour le paiement
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        booking: { include: { listing: true } },
      },
    });

    if (!payment) {
      res.status(404).json({ error: 'Paiement non trouvé' });
      return;
    }

    const amount = Number(payment.amount);
    const platformFee = calculatePlatformFee(amount);
    const ownerCommission = calculateOwnerCommission(amount);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        platformFee,
        ownerCommission,
      },
    });

    // Si c'est le premier paiement, confirmer la réservation
    if (payment.weekNumber === 1 && payment.booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });
    }

    // Notifier le propriétaire (montant net après commission 10%)
    const ownerPayout = amount - ownerCommission;
    await notificationService.send({
      userId: payment.booking.listing.ownerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Paiement reçu',
      body: `Paiement reçu pour la semaine ${payment.weekNumber} — Montant net : ${ownerPayout.toFixed(2)}€ (après commission 10%)`,
      data: { bookingId: payment.bookingId, weekNumber: payment.weekNumber },
    });

    res.json({ message: 'Paiement confirmé', payment });
  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation du paiement' });
  }
});

// POST /api/payments/cash-confirm — Propriétaire confirme réception espèces
router.post(
  '/cash-confirm',
  authenticate,
  requireRole('OWNER'),
  validate(cashConfirmSchema),
  async (req: Request, res: Response) => {
    try {
      const { bookingId, weekNumber } = req.body;

      // Vérifier que la réservation appartient à un logement du propriétaire
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { listing: true },
      });

      if (!booking || booking.listing.ownerId !== req.userId) {
        res.status(404).json({ error: 'Réservation non trouvée ou non autorisée' });
        return;
      }

      // Trouver le paiement correspondant
      const payment = await prisma.payment.findFirst({
        where: {
          bookingId,
          weekNumber,
          method: 'CASH',
        },
      });

      if (!payment) {
        res.status(404).json({ error: 'Paiement non trouvé pour cette semaine' });
        return;
      }

      if (payment.status === 'PAID') {
        res.status(400).json({ error: 'Ce paiement a déjà été confirmé' });
        return;
      }

      // Confirmer le paiement
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Si c'est le premier paiement, confirmer la réservation
      if (weekNumber === 1 && booking.status === 'PENDING') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' },
        });
      }

      // Notifier le locataire
      await notificationService.send({
        userId: booking.tenantId,
        type: 'PAYMENT_RECEIVED',
        title: 'Paiement confirmé',
        body: `Le propriétaire a confirmé la réception de votre paiement espèces pour la semaine ${weekNumber}`,
        data: { bookingId, weekNumber },
      });

      res.json({ message: `Paiement espèces semaine ${weekNumber} confirmé` });
    } catch (error) {
      console.error('Erreur confirmation espèces:', error);
      res.status(500).json({ error: 'Erreur lors de la confirmation du paiement' });
    }
  },
);

// POST /api/payments/deposit — Prélèvement dépôt de garantie (paiement espèces)
router.post('/deposit', authenticate, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking || booking.tenantId !== req.userId) {
      res.status(404).json({ error: 'Réservation non trouvée' });
      return;
    }

    if (booking.paymentMethod !== 'CASH') {
      res.status(400).json({ error: 'Le dépôt de garantie concerne uniquement les paiements espèces' });
      return;
    }

    if (!booking.depositStripeId) {
      res.status(400).json({ error: 'Aucun dépôt de garantie trouvé' });
      return;
    }

    // Récupérer le statut du PaymentIntent
    const paymentIntent = await stripeService.getPaymentIntent(booking.depositStripeId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      depositAmount: Number(booking.depositAmount),
      breakdown: {
        platformFee: calculatePlatformFee(Number(booking.weeklyPrice)),
        securityDeposit: CASH_SECURITY_DEPOSIT_EUR,
        total: Number(booking.depositAmount),
      },
    });
  } catch (error) {
    console.error('Erreur dépôt de garantie:', error);
    res.status(500).json({ error: 'Erreur lors du prélèvement du dépôt' });
  }
});

// POST /api/payments/split-pay — Payer sa part d'un paiement partagé
router.post('/split-pay', authenticate, async (req: Request, res: Response) => {
  try {
    const { inviteToken } = req.body;

    const splitPayment = await prisma.splitPayment.findUnique({
      where: { inviteToken },
      include: {
        booking: { include: { listing: true } },
      },
    });

    if (!splitPayment) {
      res.status(404).json({ error: 'Invitation non trouvée' });
      return;
    }

    if (splitPayment.isPaid) {
      res.status(400).json({ error: 'Ce paiement a déjà été effectué' });
      return;
    }

    // Associer le payeur si pas encore fait
    if (!splitPayment.payerId) {
      await prisma.splitPayment.update({
        where: { id: splitPayment.id },
        data: { payerId: req.userId },
      });
    }

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

    const paymentIntent = await stripeService.createSplitPaymentIntent(
      customerId,
      Number(splitPayment.amount),
      splitPayment.bookingId,
      splitPayment.id,
    );

    await prisma.splitPayment.update({
      where: { id: splitPayment.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: Number(splitPayment.amount),
      weekNumber: splitPayment.weekNumber,
      listingTitle: splitPayment.booking.listing.title,
    });
  } catch (error) {
    console.error('Erreur paiement partagé:', error);
    res.status(500).json({ error: 'Erreur lors du paiement partagé' });
  }
});

export default router;
