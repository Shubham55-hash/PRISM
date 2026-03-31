import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();
const CRISIS_SECRET = process.env.JWT_SECRET || 'crisis-secret';

// POST /api/crisis/request-access
router.post('/request-access', async (req: Request, res: Response): Promise<void> => {
  try {
    const { aadhaarLast4, emergencyType, requesterType, requesterName } = req.body;
    if (!aadhaarLast4 || !emergencyType || !requesterType) {
      res.status(400).json({ error: 'aadhaarLast4, emergencyType, requesterType required' }); return;
    }
    // In production, this would hash and lookup. For demo, use the demo user.
    const user = await prisma.user.findFirst({
      select: { id: true, fullName: true, dateOfBirth: true, phone: true, abhaId: true, prismId: true },
    });
    if (!user) { res.status(404).json({ error: 'No matching identity found' }); return; }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const crisisToken = jwt.sign({
      type: 'crisis',
      userId: user.id,
      emergencyType,
      requesterType,
      issuedAt: Date.now(),
      expiresAt: expiresAt.getTime(),
    }, CRISIS_SECRET, { expiresIn: '1h' });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: 'security',
        title: 'Crisis Access Requested',
        description: `Emergency ${emergencyType} access granted to ${requesterType}${requesterName ? ` (${requesterName})` : ''}`,
        metadata: JSON.stringify({ emergencyType, requesterType, requesterName }),
      },
    });

    res.json({
      crisisToken,
      expiresAt: expiresAt.toISOString(),
      grantedAccess: {
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        emergencyContact: user.phone,
        abhaId: user.abhaId,
        bloodGroup: 'B+', // Would come from FHIR records
        medicalAllergies: ['Penicillin'], // Would come from FHIR records
        insurancePolicyNumber: 'IN-2024-HLTH-7890',
      },
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
