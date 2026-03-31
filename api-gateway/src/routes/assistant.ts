import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const BUNDLE_TEMPLATES: Record<string, { stage: string; title: string; description: string; docs: string[]; confidence: number }> = {
  job_search: {
    stage: 'job_search',
    title: 'Job Application Bundle',
    description: 'You appear to be entering the job market. PRISM can auto-prepare your employment credential pack.',
    docs: ['degree_certificate', 'aadhaar', 'pan', 'photo', 'address_proof'],
    confidence: 0.87,
  },
  home_loan: {
    stage: 'home_loan',
    title: 'Home Loan Application',
    description: 'Bank statements and income proof detected. Ready to bundle your home loan documents.',
    docs: ['income_proof', 'bank_statements_6mo', 'aadhaar', 'pan', 'photo'],
    confidence: 0.82,
  },
  medical: {
    stage: 'medical',
    title: 'Medical Emergency Kit',
    description: 'Your ABHA card and insurance policy are ready for instant hospital access.',
    docs: ['aadhaar', 'abha_card', 'insurance_policy', 'medical_history'],
    confidence: 0.91,
  },
};

// GET /api/assistant/suggestions
router.get('/suggestions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const predictions = await prisma.lifeStagePrediction.findMany({
      where: { userId: req.user!.userId, isActioned: false },
      orderBy: { confidence: 'desc' },
      take: 3,
    });
    if (predictions.length > 0) {
      res.json(predictions.map(p => ({
        id: p.id,
        stage: p.predictedStage,
        title: p.title,
        description: p.description,
        confidence: p.confidence,
        suggestedBundle: p.suggestedBundle ? JSON.parse(p.suggestedBundle) : [],
      })));
      return;
    }
    // Generate a contextual suggestion from activity
    const recentDocs = await prisma.document.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { documentType: true, name: true },
    });
    const hasFinancial = recentDocs.some(d => d.documentType === 'financial');
    const hasEducation = recentDocs.some(d => d.documentType === 'education');
    const template = hasFinancial ? BUNDLE_TEMPLATES.home_loan : hasEducation ? BUNDLE_TEMPLATES.job_search : BUNDLE_TEMPLATES.job_search;

    res.json([{
      id: 'auto-suggestion',
      stage: template.stage,
      title: template.title,
      description: template.description,
      confidence: template.confidence,
      suggestedBundle: template.docs,
    }]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/assistant/bundle/:suggestion
router.post('/bundle/:suggestion', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { suggestion } = req.params;
    const template = BUNDLE_TEMPLATES[suggestion] || BUNDLE_TEMPLATES.job_search;
    const userDocs = await prisma.document.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, name: true, documentType: true, isVerified: true },
    });
    // Mark prediction as actioned if it exists
    await prisma.lifeStagePrediction.updateMany({
      where: { userId: req.user!.userId, predictedStage: suggestion },
      data: { isActioned: true },
    });
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        eventType: 'document',
        title: `Credential Bundle Prepared`,
        description: `${template.title} bundle auto-prepared by PRISM`,
      },
    });
    res.json({
      bundleName: template.title,
      stage: suggestion,
      matchedDocuments: userDocs.filter(d => template.docs.some(t => d.documentType?.includes(t.split('_')[0]))),
      missingDocuments: template.docs.filter(t => !userDocs.some(d => d.documentType?.includes(t.split('_')[0]))),
      readyForSharing: true,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
