import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// Extension du type Request pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  role: string;
}

// Middleware d'authentification JWT
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token d\'authentification requis' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// Middleware de vérification de rôle
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Accès non autorisé' });
      return;
    }
    next();
  };
}

// Middleware optionnel d'authentification (ne bloque pas si pas de token)
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JwtPayload;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {
      // Token invalide, on continue sans authentification
    }
  }

  next();
}

// Vérifier que le propriétaire a un abonnement actif
// En mode développement, on permet de bypasser cette vérification
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }

  // En mode dev, on bypass la vérification d'abonnement
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  const subscription = await prisma.ownerSubscription.findUnique({
    where: { ownerId: req.userId },
  });

  if (!subscription || subscription.status !== 'ACTIVE') {
    res.status(403).json({
      error: 'Abonnement actif requis pour publier des logements. Souscrivez à l\'abonnement propriétaire (8€/mois).',
    });
    return;
  }

  next();
}
