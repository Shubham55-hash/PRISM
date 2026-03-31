import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, password, dateOfBirth, city, state } = req.body;
    if (!fullName || !email || !phone || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      res.status(409).json({ error: 'User with this email or phone already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const prismId = `PR-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const user = await prisma.user.create({
      data: {
        prismId,
        fullName,
        displayName: fullName.split(' ')[0],
        email,
        phone,
        passwordHash,
        dateOfBirth,
        city,
        state,
        trustScore: 45,
      },
    });
    const payload = { userId: user.id, prismId: user.prismId, email: user.email, tier: user.securityTier };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: 'security',
        title: 'Account Created',
        description: 'New PRISM account registered',
      },
    });
    res.status(201).json({ accessToken, refreshToken, user: { id: user.id, prismId: user.prismId, fullName: user.fullName, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const payload = { userId: user.id, prismId: user.prismId, email: user.email, tier: user.securityTier };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: 'security',
        title: 'Login Successful',
        description: `Login from ${req.ip || 'unknown'}`,
        ipAddress: req.ip || 'unknown',
      },
    });
    res.json({ accessToken, refreshToken, user: { id: user.id, prismId: user.prismId, fullName: user.fullName, displayName: user.displayName, email: user.email, trustScore: user.trustScore } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const newPayload = { userId: user.id, prismId: user.prismId, email: user.email, tier: user.securityTier };
    res.json({ accessToken: signAccessToken(newPayload), refreshToken: signRefreshToken(newPayload) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.activityLog.create({
    data: {
      userId: req.user!.userId,
      eventType: 'security',
      title: 'Logout',
      description: 'User logged out',
    },
  });
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/verify-otp (mock)
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body;
  // Mock: accept any 6-digit OTP for demo
  if (otp && otp.length === 6) {
    res.json({ verified: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ verified: false, error: 'Invalid OTP' });
  }
});

export default router;
