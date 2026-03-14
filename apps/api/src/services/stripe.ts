import Stripe from 'stripe';
import { eurosToCents, PLATFORM_FEE_PERCENT, OWNER_SUBSCRIPTION_PRICE_CENTS } from '@gites/shared';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export const stripeService = {
  // Créer ou récupérer un client Stripe
  async getOrCreateCustomer(email: string, name: string, existingId?: string): Promise<string> {
    if (existingId) {
      return existingId;
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { platform: 'les-gites-du-nucleaire' },
    });

    return customer.id;
  },

  // Créer un PaymentIntent pour un paiement hebdomadaire par carte
  async createWeeklyPaymentIntent(
    customerId: string,
    amountEuros: number,
    bookingId: string,
    weekNumber: number,
  ): Promise<Stripe.PaymentIntent> {
    const amountCents = eurosToCents(amountEuros);
    const feeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: customerId,
      metadata: {
        bookingId,
        weekNumber: weekNumber.toString(),
        platformFee: feeCents.toString(),
      },
      automatic_payment_methods: { enabled: true },
    });

    return paymentIntent;
  },

  // Créer un PaymentIntent pour le dépôt de garantie (paiement espèces)
  async createDepositPaymentIntent(
    customerId: string,
    depositAmountEuros: number,
    bookingId: string,
  ): Promise<Stripe.PaymentIntent> {
    const amountCents = eurosToCents(depositAmountEuros);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: customerId,
      metadata: {
        bookingId,
        type: 'cash_deposit',
      },
      automatic_payment_methods: { enabled: true },
    });

    return paymentIntent;
  },

  // Rembourser le dépôt de garantie (caution) à la fin du séjour
  async refundDeposit(paymentIntentId: string, amountEuros: number): Promise<Stripe.Refund> {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: eurosToCents(amountEuros),
    });

    return refund;
  },

  // Créer l'abonnement mensuel du propriétaire (8€/mois)
  async createOwnerSubscription(
    customerId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  },

  // Annuler un abonnement
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  },

  // Créer un PaymentIntent pour un paiement partagé (split)
  async createSplitPaymentIntent(
    customerId: string,
    amountEuros: number,
    bookingId: string,
    splitPaymentId: string,
  ): Promise<Stripe.PaymentIntent> {
    const amountCents = eurosToCents(amountEuros);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: customerId,
      metadata: {
        bookingId,
        splitPaymentId,
        type: 'split_payment',
      },
      automatic_payment_methods: { enabled: true },
    });

    return paymentIntent;
  },

  // Confirmer un PaymentIntent
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.confirm(paymentIntentId);
  },

  // Récupérer un PaymentIntent
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  },

  // Gérer les webhooks Stripe
  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  },
};
