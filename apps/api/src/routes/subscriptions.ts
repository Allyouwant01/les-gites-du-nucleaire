import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { stripeService } from '../services/stripe';

const router = Router();

// POST /api/subscriptions/create — Créer l'abonnement propriétaire 8€/mois
router.post('/create', authenticate, requireRole('OWNER'), async (req: Request, res: Response) => {
  try {
    // Vérifier si un abonnement existe déjà
    const existingSub = await prisma.ownerSubscription.findUnique({
      where: { ownerId: req.userId },
    });

    if (existingSub && existingSub.status === 'ACTIVE') {
      res.status(400).json({ error: 'Vous avez déjà un abonnement actif' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Créer/récupérer le client Stripe
    const customerId = await stripeService.getOrCreateCustomer(
      user.email,
      `${user.firstName} ${user.lastName}`,
      user.stripeCustomerId || undefined,
    );

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Créer l'abonnement Stripe
    const priceId = process.env.STRIPE_PRICE_ID_SUBSCRIPTION;
    if (!priceId) {
      res.status(500).json({ error: 'Configuration Stripe incomplète' });
      return;
    }

    const subscription = await stripeService.createOwnerSubscription(customerId, priceId);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Sauvegarder l'abonnement en BDD
    if (existingSub) {
      await prisma.ownerSubscription.update({
        where: { ownerId: req.userId },
        data: {
          status: 'ACTIVE',
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      await prisma.ownerSubscription.create({
        data: {
          ownerId: req.userId!,
          plan: 'MONTHLY_8EUR',
          status: 'ACTIVE',
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Récupérer le client_secret pour la confirmation côté client
    const invoice = subscription.latest_invoice as any;
    const clientSecret = invoice?.payment_intent?.client_secret;

    res.json({
      subscriptionId: subscription.id,
      clientSecret,
      message: 'Abonnement créé avec succès (8€/mois)',
    });
  } catch (error) {
    console.error('Erreur création abonnement:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement' });
  }
});

// DELETE /api/subscriptions/cancel — Annuler l'abonnement
router.delete('/cancel', authenticate, requireRole('OWNER'), async (req: Request, res: Response) => {
  try {
    const subscription = await prisma.ownerSubscription.findUnique({
      where: { ownerId: req.userId },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Aucun abonnement actif trouvé' });
      return;
    }

    if (subscription.stripeSubscriptionId) {
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
    }

    await prisma.ownerSubscription.update({
      where: { ownerId: req.userId },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Abonnement annulé' });
  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
  }
});

// GET /api/subscriptions/status — Statut de l'abonnement
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const subscription = await prisma.ownerSubscription.findUnique({
      where: { ownerId: req.userId },
    });

    res.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Erreur statut abonnement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
});

export default router;
