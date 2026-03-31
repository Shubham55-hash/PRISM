import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/assistant/suggest
router.post('/suggest', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const documents = await prisma.document.findMany({ 
      where: { userId, isVerified: true },
      select: { name: true, documentType: true }
    });
    const consents = await prisma.consent.findMany({ 
      where: { userId, status: 'active' },
      select: { institutionName: true, purpose: true }
    });

    const context = `Verified Documents: ${documents.map(d => d.documentType || d.name).join(', ') || 'None'}. Active Consents: ${consents.map(c => c.institutionName).join(', ') || 'None'}.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.json({
        success: true,
        data: {
          suggestion: "Mock suggestion: Prepare your Unified Medical Profile package based on your recent health records.",
          confidence: 0.88
        }
      });
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: "You are PRISM's Predictive Life Assistant. Based on the user's verified documents and life stage, suggest the next credential bundle they should prepare. Be concise and actionable." 
          },
          { role: 'user', content: context }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const result = await response.json();
    const suggestionContent = result.choices[0]?.message?.content || "Gather your financial documents.";

    res.json({
      success: true,
      data: {
        suggestion: suggestionContent,
        confidence: 0.92 // Mocked confidence
      }
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/assistant/predict-stage
router.post('/predict-stage', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const documents = await prisma.document.findMany({ where: { userId } });

    let predictedStage = 'early_career';
    let title = 'Career Building';
    let description = 'Based on your recent documents, you appear to be building your employment portfolio.';
    const confidence = 0.85;

    if (documents.some(d => d.documentType === 'financial')) {
        predictedStage = 'financial_maturity';
        title = 'Financial Independence';
        description = 'Your documentation indicates preparation for major financial milestones, like loans or investments.';
    }

    const prediction = await prisma.lifeStagePrediction.create({
      data: {
        userId,
        predictedStage,
        title,
        description,
        confidence,
        suggestedBundle: JSON.stringify(['identity', 'financial'])
      }
    });

    res.status(201).json({ success: true, message: 'Life stage predicted successfully', data: prediction });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
