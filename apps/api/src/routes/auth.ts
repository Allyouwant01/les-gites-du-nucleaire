import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '@gites/shared';
import { cloudinaryService } from '../services/cloudinary';
import { uploadDocument } from '../middleware/upload';

const router = Router();

// POST /api/auth/register — Inscription
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
      return;
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: role || 'TENANT',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Générer le JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST /api/auth/login — Connexion
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Générer le JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// GET /api/auth/me — Profil de l'utilisateur connecté
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PUT /api/auth/profile — Mettre à jour le profil
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// POST /api/auth/verify-document — Upload document de vérification
router.post(
  '/verify-document',
  authenticate,
  uploadDocument.single('document'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Document requis' });
        return;
      }

      const { url } = await cloudinaryService.uploadDocument(req.file.buffer, req.userId!);

      await prisma.user.update({
        where: { id: req.userId },
        data: { verificationDocumentUrl: url },
      });

      res.json({ message: 'Document envoyé avec succès. Il sera vérifié par un administrateur.' });
    } catch (error) {
      console.error('Erreur upload document:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi du document' });
    }
  },
);

// PUT /api/auth/fcm-token — Mettre à jour le token FCM
router.put('/fcm-token', authenticate, async (req: Request, res: Response) => {
  try {
    const { fcmToken } = req.body;

    await prisma.user.update({
      where: { id: req.userId },
      data: { fcmToken },
    });

    res.json({ message: 'Token FCM mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour FCM token:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du token' });
  }
});

export default router;
