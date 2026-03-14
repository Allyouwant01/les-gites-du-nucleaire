import admin from 'firebase-admin';
import { prisma } from '../prisma';
import { NotificationType } from '@prisma/client';

// Initialiser Firebase Admin SDK uniquement si les credentials sont configurées
let firebaseInitialized = false;
if (!admin.apps.length && process.env.FCM_PROJECT_ID && process.env.FCM_PRIVATE_KEY && process.env.FCM_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FCM_CLIENT_EMAIL,
      }),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialisé');
  } catch (error) {
    console.warn('⚠️ Firebase Admin SDK non initialisé:', error);
  }
} else {
  console.warn('⚠️ Firebase Admin SDK désactivé (variables FCM non configurées). Les notifications push ne seront pas envoyées.');
}

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const notificationService = {
  // Envoyer une notification push et la sauvegarder en BDD
  async send({ userId, type, title, body, data }: SendNotificationParams): Promise<void> {
    // Sauvegarder en base de données
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? data : undefined,
      },
    });

    // Récupérer le token FCM de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    // Envoyer la notification push si le token existe et Firebase est initialisé
    if (user?.fcmToken && firebaseInitialized) {
      try {
        await admin.messaging().send({
          token: user.fcmToken,
          notification: { title, body },
          data: {
            type,
            ...(data ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)])
            ) : {}),
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'default',
              sound: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                badge: 1,
                sound: 'default',
              },
            },
          },
        });
      } catch (error) {
        console.error(`Erreur envoi notification FCM pour user ${userId}:`, error);
      }
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount, page, limit };
  },
};
