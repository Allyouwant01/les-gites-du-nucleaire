import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '@gites/shared';
import { notificationService } from '../services/notifications';

const router = Router();

// GET /api/messages/conversations — Liste des conversations
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: req.userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        booking: {
          select: {
            id: true,
            listing: { select: { title: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId !== req.userId);
      const lastMessage = conv.messages[0] || null;
      const myParticipant = conv.participants.find((p) => p.userId === req.userId);

      return {
        id: conv.id,
        otherUser: otherParticipant?.user || null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isRead: myParticipant?.lastReadAt
                ? lastMessage.createdAt <= myParticipant.lastReadAt
                : false,
            }
          : null,
        bookingId: conv.bookingId,
        bookingTitle: conv.booking?.listing?.title || null,
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
});

// GET /api/messages/:conversationId — Messages d'une conversation
router.get('/:conversationId', authenticate, async (req: Request, res: Response) => {
  try {
    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await prisma.conversationUser.findFirst({
      where: {
        conversationId: req.params.conversationId,
        userId: req.userId,
      },
    });

    if (!participant) {
      res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
      return;
    }

    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: req.params.conversationId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.message.count({
        where: { conversationId: req.params.conversationId },
      }),
    ]);

    // Marquer les messages comme lus
    await prisma.conversationUser.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });

    // Marquer les messages reçus comme lus
    await prisma.message.updateMany({
      where: {
        conversationId: req.params.conversationId,
        receiverId: req.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({
      messages: messages.reverse(),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// POST /api/messages — Envoyer un message
router.post('/', authenticate, validate(sendMessageSchema), async (req: Request, res: Response) => {
  try {
    const { conversationId, receiverId, content, bookingId } = req.body;

    let convId = conversationId;

    // Si pas de conversation existante, en créer une
    if (!convId) {
      // Vérifier s'il existe déjà une conversation entre ces deux utilisateurs
      const existingConv = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: req.userId } } },
            { participants: { some: { userId: receiverId } } },
          ],
          ...(bookingId ? { bookingId } : {}),
        },
      });

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const newConv = await prisma.conversation.create({
          data: {
            bookingId: bookingId || null,
            participants: {
              create: [
                { userId: req.userId! },
                { userId: receiverId },
              ],
            },
          },
        });
        convId = newConv.id;
      }
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: req.userId!,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // Mettre à jour la date de la conversation
    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Notifier le destinataire
    const sender = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { firstName: true },
    });

    await notificationService.send({
      userId: receiverId,
      type: 'NEW_MESSAGE',
      title: 'Nouveau message',
      body: `${sender?.firstName || 'Quelqu\'un'} vous a envoyé un message`,
      data: { conversationId: convId, messageId: message.id },
    });

    res.status(201).json({ message, conversationId: convId });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

export default router;
