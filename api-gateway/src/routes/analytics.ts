import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [user, totalDocuments, verifiedDocuments, activeConsents, trustScoreHistory] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { trustScore: true } }),
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, isVerified: true } }),
      prisma.consent.count({ where: { userId, status: 'active' } }),
      prisma.trustScoreHistory.findMany({
        where: { userId },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      })
    ]);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        totalDocuments,
        verifiedDocuments,
        activeConsents,
        trustScore: user.trustScore,
        trustScoreHistory
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/trust-history
router.get('/trust-history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await prisma.trustScoreHistory.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
