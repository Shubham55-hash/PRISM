import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/crisis/activate
router.post('/activate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const consentToken = uuidv4();
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const consent = await prisma.consent.create({
      data: {
        userId,
        institutionName: 'Emergency Medical Services',
        purpose: 'Crisis Life-Saving Access',
        allowedFields: 'aadhaarHash,abhaId,medical_documents',
        consentToken,
        status: 'active',
        expiresAt,
        accessTier: 3
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        eventType: 'crisis',
        title: 'Crisis Protocol Activated',
        description: 'Generated 24h emergency access token'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Crisis token generated (valid for 24h)',
      data: { token: consent.consentToken, expiresAt: consent.expiresAt }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crisis/:token
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    const consent = await prisma.consent.findUnique({
      where: { consentToken: token },
      include: {
        user: { select: { fullName: true, phone: true, abhaId: true, aadhaarHash: true, id: true } }
      }
    });

    if (!consent || consent.status !== 'active') {
      res.status(404).json({ success: false, message: 'Invalid or deactivated crisis token' });
      return;
    }

    if (new Date() > new Date(consent.expiresAt)) {
      res.status(403).json({ success: false, message: 'Crisis token expired' });
      return;
    }

    // Retrieve requested medical documents if available
    const documents = await prisma.document.findMany({
      where: { userId: consent.user.id, documentType: 'medical' },
      select: { name: true, fileSizeBytes: true, mimeType: true }
    });

    res.json({
      success: true,
      data: {
        patient: {
          fullName: consent.user.fullName,
          phone: consent.user.phone,
          abhaId: consent.user.abhaId,
          aadhaarHash: consent.user.aadhaarHash
        },
        medicalDocuments: documents,
        expiresAt: consent.expiresAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crisis/deactivate/:token
router.post('/deactivate/:token', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    // Revoke token 
    const consent = await prisma.consent.findUnique({ where: { consentToken: token } });
    if (!consent || consent.userId !== req.user!.userId) {
      res.status(404).json({ success: false, message: 'Crisis token not found or unauthorized' });
      return;
    }

    await prisma.consent.update({
      where: { id: consent.id },
      data: { 
        status: 'revoked',
        revokedAt: new Date()
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        eventType: 'crisis',
        title: 'Crisis Protocol Deactivated',
        description: 'Revoked emergency access token'
      }
    });

    res.json({ success: true, message: 'Crisis token deactivated immediately' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
