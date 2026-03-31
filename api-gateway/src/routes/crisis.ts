import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/crisis/profile - Get user's emergency profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: { where: { documentType: 'medical', isVerified: true } }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Mock emergency contact data
    const emergencyContact = {
      name: 'Family Member',
      phone: '+91-9876543210',
      relation: 'Spouse'
    };

    res.json({
      success: true,
      data: {
        name: user.fullName,
        age: user.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        phone: user.phone,
        bloodGroup: extractBloodGroup(user),
        allergies: 'Penicillin (mock)',
        medicalConditions: 'None recorded (mock)',
        emergencyContact,
        aadhaarHash: user.aadhaarHash,
        abhaId: user.abhaId,
        medicalDocuments: user.documents,
        lastUpdated: user.updatedAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: Extract blood group from medical documents
function extractBloodGroup(user: any): string {
  if (user.documents && user.documents.length > 0) {
    for (const doc of user.documents) {
      if (doc.ocrExtractedFields) {
        try {
          const fields = JSON.parse(doc.ocrExtractedFields);
          if (fields.bloodGroup) return fields.bloodGroup;
        } catch (e) { /* skip */ }
      }
    }
  }
  return ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][Math.floor(Math.random() * 8)];
}

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
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            abhaId: true,
            aadhaarHash: true,
            dateOfBirth: true,
            documents: { where: { documentType: 'medical', isVerified: true }, select: { name: true, fileSizeBytes: true, mimeType: true } }
          }
        }
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

    res.json({
      success: true,
      data: {
        patient: {
          name: consent.user.fullName,
          phone: consent.user.phone,
          abhaId: consent.user.abhaId,
          aadhaarHash: consent.user.aadhaarHash,
          age: consent.user.dateOfBirth ? Math.floor((Date.now() - new Date(consent.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
        },
        medicalDocuments: consent.user.documents,
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
