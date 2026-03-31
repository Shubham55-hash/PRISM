import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/activity
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '20', offset = '0' } = req.query;
    const take = parseInt(limit as string, 10);
    const skip = parseInt(offset as string, 10);

    const where = { userId: req.user!.userId };

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: { total, limit: take, offset: skip }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
