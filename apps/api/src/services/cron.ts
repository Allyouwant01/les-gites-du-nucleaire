import cron from 'node-cron';
import { prisma } from '../prisma';
import { stripeService } from './stripe';
import { notificationService } from './notifications';
import { OVERDUE_AFTER_DAYS } from '@gites/shared';

// CRON job exécuté chaque lundi à 8h00 pour traiter les paiements hebdomadaires
export function startPaymentCronJobs(): void {
  // Chaque lundi à 8h00 : vérifier et traiter les paiements hebdomadaires
  cron.schedule('0 8 * * 1', async () => {
    console.log('[CRON] Traitement des paiements hebdomadaires...');
    await processWeeklyPayments();
  });

  // Chaque jour à 9h00 : envoyer des rappels et marquer les retards
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Vérification des retards de paiement...');
    await checkOverduePayments();
  });

  // Chaque jour à 10h00 : rappels 2 jours avant l'échéance
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Envoi des rappels de paiement...');
    await sendPaymentReminders();
  });

  // Chaque jour : vérifier les séjours terminés et rembourser les cautions
  cron.schedule('0 12 * * *', async () => {
    console.log('[CRON] Vérification des séjours terminés...');
    await processCompletedStays();
  });

  console.log('[CRON] Jobs de paiement programmés');
}

// Traiter les paiements hebdomadaires par carte
async function processWeeklyPayments(): Promise<void> {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Trouver les paiements par carte dus cette semaine
    const duePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        method: 'CARD',
        dueDate: { lte: endOfWeek },
        booking: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
      },
      include: {
        user: true,
        booking: { include: { listing: true } },
      },
    });

    for (const payment of duePayments) {
      try {
        if (!payment.user.stripeCustomerId) continue;

        // Tenter le prélèvement automatique
        const paymentIntent = await stripeService.createWeeklyPaymentIntent(
          payment.user.stripeCustomerId,
          Number(payment.amount),
          payment.bookingId,
          payment.weekNumber,
        );

        await prisma.payment.update({
          where: { id: payment.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });

        console.log(`[CRON] PaymentIntent créé pour paiement ${payment.id}`);
      } catch (error) {
        console.error(`[CRON] Erreur prélèvement paiement ${payment.id}:`, error);
      }
    }

    // Envoyer des rappels pour les paiements espèces dus cette semaine
    const cashPaymentsDue = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        method: 'CASH',
        dueDate: { lte: endOfWeek },
        booking: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
      },
      include: {
        booking: { include: { listing: true } },
      },
    });

    for (const payment of cashPaymentsDue) {
      await notificationService.send({
        userId: payment.userId,
        type: 'PAYMENT_REMINDER',
        title: 'Rappel de paiement',
        body: `Paiement de ${payment.amount}€ dû cette semaine pour "${payment.booking.listing.title}" (semaine ${payment.weekNumber})`,
        data: { bookingId: payment.bookingId, paymentId: payment.id },
      });
    }
  } catch (error) {
    console.error('[CRON] Erreur processWeeklyPayments:', error);
  }
}

// Vérifier les paiements en retard
async function checkOverduePayments(): Promise<void> {
  try {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - OVERDUE_AFTER_DAYS);

    // Marquer les paiements en retard (plus de 3 jours après l'échéance)
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: overdueDate },
        booking: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
      },
      include: {
        booking: { include: { listing: true } },
      },
    });

    for (const payment of overduePayments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'OVERDUE' },
      });

      // Notifier le locataire
      await notificationService.send({
        userId: payment.userId,
        type: 'PAYMENT_OVERDUE',
        title: 'Paiement en retard',
        body: `Votre paiement de ${payment.amount}€ pour "${payment.booking.listing.title}" (semaine ${payment.weekNumber}) est en retard`,
        data: { bookingId: payment.bookingId, paymentId: payment.id },
      });

      // Notifier le propriétaire
      await notificationService.send({
        userId: payment.booking.listing.ownerId,
        type: 'PAYMENT_OVERDUE',
        title: 'Paiement locataire en retard',
        body: `Le paiement semaine ${payment.weekNumber} pour "${payment.booking.listing.title}" est en retard`,
        data: { bookingId: payment.bookingId },
      });
    }
  } catch (error) {
    console.error('[CRON] Erreur checkOverduePayments:', error);
  }
}

// Envoyer des rappels de paiement 2 jours avant l'échéance
async function sendPaymentReminders(): Promise<void> {
  try {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 2);

    const upcomingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: reminderDate,
        },
        booking: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
      },
      include: {
        booking: { include: { listing: true } },
      },
    });

    for (const payment of upcomingPayments) {
      await notificationService.send({
        userId: payment.userId,
        type: 'PAYMENT_REMINDER',
        title: 'Rappel de paiement',
        body: `Paiement de ${payment.amount}€ dû dans 2 jours pour "${payment.booking.listing.title}" (semaine ${payment.weekNumber})`,
        data: { bookingId: payment.bookingId, paymentId: payment.id },
      });
    }
  } catch (error) {
    console.error('[CRON] Erreur sendPaymentReminders:', error);
  }
}

// Traiter les séjours terminés : rembourser les cautions et mettre à jour le statut
async function processCompletedStays(): Promise<void> {
  try {
    const today = new Date();

    // Trouver les réservations dont le check-out est passé
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'ACTIVE',
        checkOutDate: { lt: today },
      },
    });

    for (const booking of completedBookings) {
      // Mettre à jour le statut
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      });

      // Rembourser la caution si paiement espèces
      if (
        booking.paymentMethod === 'CASH' &&
        booking.depositStripeId &&
        !booking.depositRefunded
      ) {
        try {
          // Vérifier que tous les paiements espèces ont été confirmés
          const unpaidWeeks = await prisma.payment.count({
            where: {
              bookingId: booking.id,
              status: { not: 'PAID' },
            },
          });

          if (unpaidWeeks === 0) {
            await stripeService.refundDeposit(
              booking.depositStripeId,
              100, // Caution de sécurité uniquement, la commission est conservée
            );

            await prisma.booking.update({
              where: { id: booking.id },
              data: { depositRefunded: true },
            });

            // Notifier le locataire
            await notificationService.send({
              userId: booking.tenantId,
              type: 'PAYMENT_RECEIVED',
              title: 'Caution remboursée',
              body: 'Votre caution de 100€ a été remboursée. Merci pour votre séjour !',
              data: { bookingId: booking.id },
            });
          }
        } catch (error) {
          console.error(`[CRON] Erreur remboursement caution booking ${booking.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('[CRON] Erreur processCompletedStays:', error);
  }
}
