import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Clock, Shield, Key, FileText, UserCheck } from 'lucide-react';

const router = Router();

const EVENT_ICONS: Record<string, { color: string; bg: string }> = {
  verification: { color: 'text-primary', bg: 'bg-surface-container' },
  document: { color: 'text-primary', bg: 'bg-surface-container' },
  consent: { color: 'text-on-secondary-container', bg: 'bg-secondary-container' },
  security: { color: 'text-tertiary', bg: 'bg-tertiary-fixed/20' },
  api_access: { color: 'text-outline', bg: 'bg-surface-container' },
  access: { color: 'text-primary', bg: 'bg-surface-container' },
};

// GET /api/activity
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, page = '1', limit = '20', search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = { userId: req.user!.userId };
    if (type) where.eventType = type;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { entityName: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      activities: logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        iconStyle: EVENT_ICONS[log.eventType] || EVENT_ICONS.access,
        timeAgo: timeAgo(new Date(log.createdAt)),
      })),
      pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), pages: Math.ceil(total / parseInt(limit as string)) },
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
}

export default router;
