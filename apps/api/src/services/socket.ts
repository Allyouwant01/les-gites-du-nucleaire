import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:8081'],
      methods: ['GET', 'POST'],
    },
  });

  // Middleware d'authentification Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('Authentification requise'));
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as {
        userId: string;
      };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`[Socket.IO] Utilisateur connecté: ${userId}`);

    // Rejoindre la room personnelle de l'utilisateur
    socket.join(`user:${userId}`);

    // Rejoindre une conversation
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Quitter une conversation
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Envoyer un message en temps réel
    socket.on('send_message', async (data: {
      conversationId: string;
      receiverId: string;
      content: string;
    }) => {
      try {
        const { conversationId, receiverId, content } = data;

        // Vérifier l'accès à la conversation
        const participant = await prisma.conversationUser.findFirst({
          where: { conversationId, userId },
        });

        if (!participant) return;

        // Créer le message en BDD
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            receiverId,
            content,
          },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        });

        // Mettre à jour la conversation
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Émettre le message à tous les participants de la conversation
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        // Notifier le destinataire s'il n'est pas dans la conversation
        io.to(`user:${receiverId}`).emit('message_notification', {
          conversationId,
          message,
        });
      } catch (error) {
        console.error('[Socket.IO] Erreur envoi message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Indicateur "en train d'écrire"
    socket.on('typing_start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
        userId,
        conversationId: data.conversationId,
      });
    });

    // Marquer les messages comme lus
    socket.on('mark_read', async (data: { conversationId: string }) => {
      try {
        await prisma.message.updateMany({
          where: {
            conversationId: data.conversationId,
            receiverId: userId,
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        await prisma.conversationUser.updateMany({
          where: {
            conversationId: data.conversationId,
            userId,
          },
          data: { lastReadAt: new Date() },
        });

        // Notifier l'expéditeur que ses messages ont été lus
        socket.to(`conversation:${data.conversationId}`).emit('messages_read', {
          conversationId: data.conversationId,
          readBy: userId,
        });
      } catch (error) {
        console.error('[Socket.IO] Erreur mark_read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Utilisateur déconnecté: ${userId}`);
    });
  });

  return io;
}

// Envoyer une notification en temps réel à un utilisateur
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
