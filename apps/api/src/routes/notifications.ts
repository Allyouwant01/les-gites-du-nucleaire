import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/notifications';

const router = Router();

// GET /api/notifications — Mes notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const result = await notificationService.getUserNotifications(req.userId!, pageNum, limitNum);

    res.json(result);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

// PUT /api/notifications/:id/read — Marquer comme lue
router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    await notificationService.markAsRead(req.params.id, req.userId!);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// PUT /api/notifications/read-all — Marquer toutes comme lues
router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
