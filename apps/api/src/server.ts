import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';

import authRoutes from './routes/auth';
import plantRoutes from './routes/plants';
import listingRoutes from './routes/listings';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscriptions';
import messageRoutes from './routes/messages';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';

import { initializeSocket } from './services/socket';
import { startPaymentCronJobs } from './services/cron';

const app = express();
const httpServer = createServer(app);

// Middleware globaux
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    process.env.CORS_ORIGIN || '',
    'https://lesgitesdunucleaire.fr',
    'https://www.lesgitesdunucleaire.fr',
  ].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Route de santé
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gestion des erreurs globale
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Route 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Initialiser Socket.IO pour la messagerie temps réel
initializeSocket(httpServer);

// Démarrer les CRON jobs de paiement
startPaymentCronJobs();

// Démarrer le serveur
const PORT = process.env.API_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 API Les Gîtes du Nucléaire démarrée sur le port ${PORT}`);
  console.log(`📡 Socket.IO activé`);
  console.log(`⏰ CRON jobs de paiement activés`);
});

export default app;
