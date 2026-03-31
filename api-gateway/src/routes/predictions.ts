import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { analyzeUserLifeEvents } from '../services/predictionEngine';

const router = Router();

// ── GET /api/predictions/life-events ───────────────────────────────────────
router.get('/life-events', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const predictions = await prisma.lifeStagePrediction.findMany({
      where: { userId },
      orderBy: { predictedAt: 'desc' },
    });
    
    res.json({ success: true, data: { predictions } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/predictions/analyze ─────────────────────────────────────────
router.post('/analyze', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const newPredictions = await analyzeUserLifeEvents(userId);
    
    res.json({ 
      success: true, 
      message: 'Analysis complete', 
      data: { newPredictions } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/predictions/:id/action ───────────────────────────────────────
router.put('/:id/action', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prediction = await prisma.lifeStagePrediction.update({
      where: { id, userId: req.user!.userId },
      data: { isActioned: true },
    });
    
    res.json({ success: true, message: 'Prediction actioned', data: { prediction } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
