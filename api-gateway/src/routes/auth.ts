import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a PRISM-XXXX-XXXX style ID (uppercase alphanumeric segments). */
function generatePrismId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PRISM-${seg(4)}-${seg(4)}`;
}

/** Safe user profile — never expose passwordHash. */
function safeUser(u: {
  id: string; prismId: string; fullName: string; displayName: string | null;
  email: string; phone: string; trustScore: number; securityTier: number;
  city: string | null; state: string | null; profilePhotoUrl: string | null;
  biometricStatus: string; digilockerLinked: boolean; createdAt: Date;
}) {
  return {
    id: u.id,
    prismId: u.prismId,
    fullName: u.fullName,
    displayName: u.displayName,
    email: u.email,
    phone: u.phone,
    trustScore: u.trustScore,
    securityTier: u.securityTier,
    city: u.city,
    state: u.state,
    profilePhotoUrl: u.profilePhotoUrl,
    biometricStatus: u.biometricStatus,
    digilockerLinked: u.digilockerLinked,
    createdAt: u.createdAt,
  };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, password, dateOfBirth, city, state } = req.body;

    if (!fullName || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'fullName, email, phone, and password are required' });
      return;
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      res.status(409).json({ success: false, message: 'A user with this email or phone already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const prismId = generatePrismId();

    const user = await prisma.user.create({
      data: {
        prismId,
        fullName,
        displayName: fullName.split(' ')[0],
        email,
        phone,
        passwordHash,
        dateOfBirth: dateOfBirth ?? null,
        city: city ?? null,
        state: state ?? null,
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

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { accessToken, refreshToken, user: safeUser(user) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
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

    res.json({
      success: true,
      message: 'Login successful',
      data: { accessToken, refreshToken, user: safeUser(user) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: { user: safeUser(user) } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// No Redis available — client must discard the token.
// In a later step, add a server-side token blacklist (Redis SET with TTL).
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        eventType: 'security',
        title: 'Logout',
        description: 'User logged out',
      },
    });
    res.json({ success: true, message: 'Logged out successfully. Please discard your token.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'refreshToken is required' });
      return;
    }
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    const newPayload = { userId: user.id, prismId: user.prismId, email: user.email, tier: user.securityTier };
    res.json({
      success: true,
      data: { accessToken: signAccessToken(newPayload), refreshToken: signRefreshToken(newPayload) },
    });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// ── POST /api/auth/verify-otp (mock) ─────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { otp } = req.body;
  if (otp && String(otp).length === 6) {
    res.json({ success: true, message: 'OTP verified successfully', data: { verified: true } });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP — must be 6 digits', data: { verified: false } });
  }
});

export default router;
