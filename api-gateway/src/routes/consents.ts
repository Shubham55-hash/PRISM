import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { broadcastToUser } from '../utils/websocket';

const router = Router();

// GET /api/consents
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consents = await prisma.consent.findMany({
      where: { userId: req.user!.userId },
      orderBy: { grantedAt: 'desc' },
    });
    const now = new Date();
    const enriched = consents.map(c => ({
      ...c,
      isExpired: new Date(c.expiresAt) < now,
      allowedFields: c.allowedFields ? c.allowedFields.split(',') : [],
    }));
    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/consents
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { institutionName, purpose, allowedFields, expiresAt } = req.body;
    if (!institutionName || !purpose || !expiresAt) {
      res.status(400).json({ success: false, message: 'institutionName, purpose, and expiresAt are required' });
      return;
    }

    const consentToken = uuidv4();
    const consent = await prisma.consent.create({
      data: {
        userId: req.user!.userId,
        institutionName,
        purpose,
        allowedFields: Array.isArray(allowedFields) ? allowedFields.join(',') : allowedFields,
        consentToken,
        status: 'active',
        expiresAt: new Date(expiresAt),
      },
    });
    
    // Broadcast real-time update
    broadcastToUser(req.user!.userId, 'consent_granted', { 
      consentId: consent.id, 
      institutionName 
    });

    const now = new Date();
    res.status(201).json({
      success: true,
      message: 'Consent created successfully',
      data: {
        ...consent,
        isExpired: new Date(consent.expiresAt) < now,
        allowedFields: consent.allowedFields ? consent.allowedFields.split(',') : [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/consents/:id/revoke
router.patch('/:id/revoke', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consent = await prisma.consent.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!consent) {
      res.status(404).json({ success: false, message: 'Consent not found' });
      return;
    }

    const updated = await prisma.consent.update({
      where: { id: req.params.id },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    
    // Broadcast real-time update
    broadcastToUser(req.user!.userId, 'consent_revoked', { 
      consentId: updated.id, 
      institutionName: updated.institutionName 
    });

    res.json({ success: true, message: 'Consent revoked', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/consents/:token/verify (public route)
router.get('/:token/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await prisma.consent.findUnique({ where: { consentToken: req.params.token } });
    if (!consent) {
      res.status(404).json({ success: false, message: 'Consent not found' });
      return;
    }

    const isExpired = new Date(consent.expiresAt) < new Date();
    const isValid = consent.status === 'active' && !isExpired;

    res.json({ success: true, data: { isValid, isExpired, status: consent.status, consent } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
