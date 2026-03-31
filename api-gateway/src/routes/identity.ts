import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/identity
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, prismId: true, fullName: true, displayName: true, email: true,
        phone: true, dateOfBirth: true, addressLine: true, city: true, state: true,
        abhaId: true, biometricStatus: true,
        securityTier: true, trustScore: true, profilePhotoUrl: true,
        pendingRequests: true, createdAt: true,
        _count: { select: { documents: true, consents: { where: { status: 'active' } } } },
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/identity/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, displayName, email, phone, dateOfBirth, addressLine, city, state } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { fullName, displayName, email, phone, dateOfBirth, addressLine, city, state },
    });
    await prisma.activityLog.create({
      data: { userId: user.id, eventType: 'security', title: 'Profile Updated', description: 'Personal details updated' },
    });
    res.json({ message: 'Profile updated', user });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/identity/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'currentPassword and newPassword are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    
    await prisma.activityLog.create({
      data: { userId: user.id, eventType: 'security', title: 'Password Changed', description: 'Account password updated securely' },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/identity/account
router.delete('/account', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    // Manual cascading deletion (safest route without modifying Prisma schema)
    await prisma.activityLog.deleteMany({ where: { userId } });
    await prisma.consent.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.trustScoreHistory.deleteMany({ where: { userId } });
    
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/identity/prism-id
router.get('/prism-id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { prismId: true, fullName: true, profilePhotoUrl: true, securityTier: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const issuedOn = new Date(user.createdAt);
    const expiresOn = new Date(issuedOn);
    expiresOn.setFullYear(expiresOn.getFullYear() + 5);
    res.json({
      prismId: user.prismId,
      fullName: user.fullName,
      profilePhotoUrl: user.profilePhotoUrl,
      securityTier: user.securityTier,
      issuedOn: issuedOn.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      expiresOn: expiresOn.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/identity/trust-score
router.get('/trust-score', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        _count: { select: { documents: true, consents: { where: { status: 'active' } }, activityLog: true } },
        documents: { select: { isVerified: true } },
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const totalDocs = user._count.documents;
    const verifiedDocs = user.documents.filter(d => d.isVerified).length;
    const activeConsents = user._count.consents;

    const identity = Math.min(30, Math.round(5 + (user.biometricStatus === 'active' ? 10 : 0) + (user.abhaId ? 5 : 0)));
    const docScore = totalDocs > 0 ? Math.min(25, Math.round((verifiedDocs / totalDocs) * 25)) : 0;
    const consentScore = Math.min(20, activeConsents * 2);
    const activityScore = Math.min(15, user._count.activityLog > 5 ? 15 : user._count.activityLog * 3);
    const securityScore = user.securityTier * 3;

    const total = identity + docScore + consentScore + activityScore + securityScore;
    const rounded = Math.min(100, total);

    await prisma.user.update({ where: { id: user.id }, data: { trustScore: rounded } });

    res.json({
      score: rounded,
      breakdown: { identity, documents: docScore, consents: consentScore, activity: activityScore, security: securityScore },
      label: rounded >= 90 ? 'EXCELLENT' : rounded >= 75 ? 'SECURE' : rounded >= 50 ? 'MODERATE' : 'LOW',
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/identity/link-aadhaar (mock)
router.post('/link-aadhaar', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { aadhaarNumber } = req.body;
  if (!aadhaarNumber || aadhaarNumber.length !== 12) {
    res.status(400).json({ error: 'Valid 12-digit Aadhaar number required' }); return;
  }
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
  await prisma.user.update({ where: { id: req.user!.userId }, data: { aadhaarHash: hash } });
  await prisma.activityLog.create({
    data: { userId: req.user!.userId, eventType: 'verification', title: 'Aadhaar Linked', description: 'Aadhaar hash stored securely' },
  });
  res.json({ message: 'Aadhaar linked successfully' });
});

// POST /api/identity/link-abha (mock)
router.post('/link-abha', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { abhaId } = req.body;
  await prisma.user.update({ where: { id: req.user!.userId }, data: { abhaId } });
  res.json({ message: 'ABHA ID linked successfully' });
});

export default router;
