import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/activity
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '20', offset = '0', type } = req.query;
    const take = parseInt(limit as string, 10);
    const skip = parseInt(offset as string, 10);

    const where: any = { userId: req.user!.userId };
    if (type) {
      where.eventType = type as string;
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Format activities for frontend (add timeAgo and iconStyle)
    const formattedActivities = activities.map(act => {
      const now = new Date();
      const created = new Date(act.createdAt);
      const diffInSecs = Math.floor((now.getTime() - created.getTime()) / 1000);
      
      let timeAgo = 'Just now';
      if (diffInSecs < 60) timeAgo = `${diffInSecs}s ago`;
      else if (diffInSecs < 3600) timeAgo = `${Math.floor(diffInSecs / 60)}m ago`;
      else if (diffInSecs < 86400) timeAgo = `${Math.floor(diffInSecs / 3600)}h ago`;
      else timeAgo = `${Math.floor(diffInSecs / 86400)}d ago`;

      const iconStyles: Record<string, { color: string; bg: string }> = {
        verification: { color: 'text-[#705831]', bg: 'bg-[#705831]/10' },
        document: { color: 'text-blue-600', bg: 'bg-blue-100' },
        consent: { color: 'text-green-600', bg: 'bg-green-100' },
        security: { color: 'text-amber-600', bg: 'bg-amber-100' },
        default: { color: 'text-secondary', bg: 'bg-surface-container' }
      };

      return {
        ...act,
        timeAgo,
        iconStyle: iconStyles[act.eventType] || iconStyles.default
      };
    });

    res.json({
      activities: formattedActivities,
      pagination: { 
        total, 
        limit: take, 
        offset: skip,
        page: Math.floor(skip / take) + 1,
        pages: Math.ceil(total / take)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
