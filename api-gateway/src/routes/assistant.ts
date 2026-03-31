import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Rule-based suggestions engine
async function generateSuggestions(userId: string): Promise<Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low'; icon: string }>> {
  const suggestions: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low'; icon: string }> = [];
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      documents: { where: { isVerified: true } },
      consents: { where: { status: 'active' } }
    }
  });

  if (!user) return suggestions;

  // Calculate age if DOB exists
  let age = 0;
  if (user.dateOfBirth) {
    const dob = new Date(user.dateOfBirth);
    age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  const docTypes = user.documents.map(d => d.documentType).filter(Boolean);
  const hasIdentity = docTypes.includes('identity');
  const hasFinancial = docTypes.includes('financial');
  const hasEducation = docTypes.includes('education');
  const hasEmployment = docTypes.includes('employment');
  const hasMedical = docTypes.includes('medical');

  // Rule 1: Identity completion check
  if (!hasIdentity) {
    suggestions.push({
      title: 'Complete Your Identity Profile',
      description: 'Upload identification documents (Aadhaar, PAN, or Passport) to unlock full platform access.',
      priority: 'high',
      icon: '🪪'
    });
  }

  // Rule 2: Financial documentation for working professionals
  if (hasEmployment && !hasFinancial && age > 25) {
    suggestions.push({
      title: 'Prepare Financial Documents',
      description: 'Your employment history is verified. Upload salary slips or tax returns to build credit credibility.',
      priority: 'high',
      icon: '💰'
    });
  }

  if (age >= 25 && !hasMedical) {
    suggestions.push({
      title: 'Add Medical Information',
      description: 'Maintain your health records and medical history for personal access.',
      priority: 'medium',
      icon: '🏥'
    });
  }

  // Rule 5: Consent management
  if (user.consents.length === 0 && user.documents.length > 2) {
    suggestions.push({
      title: 'Grant Selective Consents',
      description: 'You have verified documents ready. Grant consents to institutions with fine-grained control.',
      priority: 'medium',
      icon: '✅'
    });
  }



  // Rule 7: Trust score improvement
  if (user.trustScore < 50 && user.documents.length >= 3) {
    suggestions.push({
      title: 'Boost Your Trust Score',
      description: `Your trust score is ${user.trustScore}/100. Verify more documents to increase credibility.`,
      priority: 'low',
      icon: '⭐'
    });
  }

  // Rule 8: Education verification
  if (hasEmployment && !hasEducation && age > 22) {
    suggestions.push({
      title: 'Verify Your Educational Background',
      description: 'Add your degree certificates to build a complete professional profile.',
      priority: 'low',
      icon: '🎓'
    });
  }

  return suggestions;
}

// GET /api/assistant/suggestions
router.get('/suggestions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const suggestions = await generateSuggestions(userId);

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/assistant/suggest (legacy endpoint - kept for compatibility)
router.post('/suggest', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const suggestions = await generateSuggestions(userId);
    
    // Return primary suggestion
    const topSuggestion = suggestions.find(s => s.priority === 'high') || suggestions[0];

    res.json({
      success: true,
      data: {
        suggestion: topSuggestion?.title || 'Keep your profile updated',
        description: topSuggestion?.description,
        confidence: 0.92,
        allSuggestions: suggestions
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { documents: true }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const docTypes = user.documents.map(d => d.documentType);
    let stage = 'early_career';
    let title = 'Career Building';
    let description = 'Focus on establishing your professional identity.';
    let icon = '🚀';
    const bundle = ['identity', 'education'];

    // Age-based stage determination
    if (user.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 25) {
        stage = 'student';
        title = 'Student Life';
        description = 'Build your education and early professional portfolio.';
        icon = '📚';
        bundle.push('employment');
      } else if (age < 35) {
        if (docTypes.includes('financial')) {
          stage = 'early_professional';
          title = 'Professional Growth';
          description = 'You are building financial stability and career progression.';
          icon = '💼';
          bundle.push('financial', 'employment');
        }
      } else if (age < 50) {
        stage = 'established';
        title = 'Financial Independence';
        description = 'Focus on wealth creation and family security.';
        icon = '🏠';
        bundle.push('financial', 'medical', 'legal');
      } else {
        stage = 'retirement';
        title = 'Retirement Planning';
        description = 'Secure your estate and healthcare preferences.';
        icon = '🌅';
        bundle.push('medical', 'legal', 'financial');
      }
    }

    const prediction = await prisma.lifeStagePrediction.create({
      data: {
        userId,
        predictedStage: stage,
        title,
        description,
        confidence: 0.85,
        suggestedBundle: JSON.stringify(bundle)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Life stage predicted',
      data: {
        stage: prediction.predictedStage,
        title: prediction.title,
        description: prediction.description,
        icon,
        suggestedBundle: bundle,
        confidence: prediction.confidence
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
