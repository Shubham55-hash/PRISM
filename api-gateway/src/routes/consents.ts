import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const CONSENT_SECRET = process.env.JWT_SECRET || 'consent-secret';

// GET /api/consents
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;
    const consents = await prisma.consent.findMany({
      where,
      orderBy: { grantedAt: 'desc' },
    });
    res.json(consents.map(c => ({
      ...c,
      allowedFields: c.allowedFields ? c.allowedFields.split(',') : [],
      isExpired: new Date(c.expiresAt) < new Date(),
    })));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/consents
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { institutionName, institutionId, purpose, accessTier, allowedFields, expiryDays, institutionLogoUrl } = req.body;
    if (!institutionName || !purpose) {
      res.status(400).json({ error: 'institutionName and purpose required' }); return;
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiryDays || 30));

    const consentPayload = {
      consentId: uuidv4(),
      userId: req.user!.userId,
      institutionId: institutionId || institutionName.toLowerCase().replace(/\s/g, '_'),
      allowedFields: allowedFields || [],
      accessTier: accessTier || 1,
      purpose,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
      readOnly: true,
    };
    const consentToken = jwt.sign(consentPayload, CONSENT_SECRET);

    const consent = await prisma.consent.create({
      data: {
        userId: req.user!.userId,
        institutionName,
        institutionId: institutionId || consentPayload.institutionId,
        purpose,
        accessTier: accessTier || 1,
        allowedFields: Array.isArray(allowedFields) ? allowedFields.join(',') : allowedFields,
        consentToken,
        status: 'active',
        expiresAt,
        institutionLogoUrl,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        eventType: 'consent',
        title: 'Consent Granted',
        description: `Data access granted to ${institutionName} for ${purpose}`,
        entityName: institutionName,
        consentId: consent.id,
      },
    });

    res.status(201).json({ message: 'Consent granted', consent });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/consents/audit-log
router.get('/audit-log', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user!.userId, eventType: 'consent' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/consents/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consent = await prisma.consent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!consent) { res.status(404).json({ error: 'Consent not found' }); return; }
    const logs = await prisma.activityLog.findMany({
      where: { consentId: consent.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ...consent, allowedFields: consent.allowedFields?.split(',') || [], auditLog: logs });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/consents/:id (revoke)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consent = await prisma.consent.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!consent) { res.status(404).json({ error: 'Consent not found' }); return; }
    await prisma.consent.update({
      where: { id: req.params.id },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        eventType: 'consent',
        title: 'Consent Revoked',
        description: `Access revoked from ${consent.institutionName}`,
        entityName: consent.institutionName,
        consentId: consent.id,
      },
    });
    res.json({ message: 'Consent revoked successfully' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/consents/:id/extend
router.post('/:id/extend', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { additionalDays = 30 } = req.body;
    const consent = await prisma.consent.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!consent) { res.status(404).json({ error: 'Consent not found' }); return; }
    const newExpiry = new Date(consent.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);
    await prisma.consent.update({ where: { id: req.params.id }, data: { expiresAt: newExpiry, status: 'active' } });
    res.json({ message: 'Consent extended', expiresAt: newExpiry });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
