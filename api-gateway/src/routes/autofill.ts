import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { broadcastToUser } from '../utils/websocket';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the full autofill profile from user + documents
// ─────────────────────────────────────────────────────────────────────────────
async function buildAutofillProfile(userId: string, allowedFields: string[]) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            documents: {
                where: { isVerified: true },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!user) return null;

    // Base profile fields
    const fullProfile: Record<string, any> = {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.addressLine,
        city: user.city,
        state: user.state,
        prismId: user.prismId,
        abhaId: user.abhaId,
    };

    // Merge OCR-extracted fields from verified documents
    for (const doc of user.documents) {
        if (doc.ocrExtractedFields) {
            try {
                const ocr = JSON.parse(doc.ocrExtractedFields);
                const docType = doc.documentType || 'other';

                if (docType === 'identity') {
                    if (ocr.aadhaarNumber) fullProfile['aadhaarNumber'] = ocr.aadhaarNumber;
                    if (ocr.panNumber) fullProfile['panNumber'] = ocr.panNumber;
                    if (ocr.passportNumber) fullProfile['passportNumber'] = ocr.passportNumber;
                    if (ocr.dob) fullProfile['dateOfBirth'] = fullProfile['dateOfBirth'] || ocr.dob;
                    if (ocr.gender) fullProfile['gender'] = ocr.gender;
                }
                if (docType === 'address') {
                    if (ocr.address) fullProfile['address'] = fullProfile['address'] || ocr.address;
                    if (ocr.pincode) fullProfile['pincode'] = ocr.pincode;
                }
                if (docType === 'financial') {
                    if (ocr.accountNumber) fullProfile['bankAccountNumber'] = ocr.accountNumber;
                    if (ocr.ifsc) fullProfile['ifscCode'] = ocr.ifsc;
                    if (ocr.panNumber) fullProfile['panNumber'] = fullProfile['panNumber'] || ocr.panNumber;
                    if (ocr.annualIncome) fullProfile['annualIncome'] = ocr.annualIncome;
                }
                if (docType === 'education') {
                    if (ocr.institution) fullProfile['educationInstitution'] = ocr.institution;
                    if (ocr.degree) fullProfile['degree'] = ocr.degree;
                    if (ocr.year) fullProfile['graduationYear'] = ocr.year;
                }
                if (docType === 'employment') {
                    if (ocr.employer) fullProfile['employer'] = ocr.employer;
                    if (ocr.designation) fullProfile['designation'] = ocr.designation;
                }
                if (docType === 'medical') {
                    if (ocr.bloodGroup) fullProfile['bloodGroup'] = ocr.bloodGroup;
                }
            } catch (_) { }
        }
    }

    // DigiLocker mock fields
    if (user.digilockerLinked) {
        fullProfile['digilockerLinked'] = true;
        fullProfile['aadhaarVerified'] = !!user.aadhaarHash;
    }

    // Filter to only allowed fields
    const filtered: Record<string, any> = {};
    for (const field of allowedFields) {
        if (fullProfile[field] !== undefined && fullProfile[field] !== null) {
            filtered[field] = fullProfile[field];
        }
    }

    return filtered;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/autofill/profile — returns the full autofill profile for the user
// (used in the PRISM dashboard to preview what data is available)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ALL_FIELDS = [
            'fullName', 'email', 'phone', 'dateOfBirth', 'address', 'city', 'state',
            'pincode', 'prismId', 'abhaId', 'aadhaarNumber', 'panNumber', 'passportNumber',
            'gender', 'bankAccountNumber', 'ifscCode', 'annualIncome', 'educationInstitution',
            'degree', 'graduationYear', 'employer', 'designation', 'bloodGroup',
            'digilockerLinked', 'aadhaarVerified',
        ];
        const profile = await buildAutofillProfile(req.user!.userId, ALL_FIELDS);
        res.json({ success: true, data: profile });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/autofill/token — create an autofill consent token for an external app
// ─────────────────────────────────────────────────────────────────────────────
router.post('/token', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appName, purpose, allowedFields, expiresAt } = req.body;

        if (!appName || !purpose || !allowedFields || !expiresAt) {
            res.status(400).json({ success: false, message: 'appName, purpose, allowedFields, and expiresAt are required' });
            return;
        }

        const consentToken = uuidv4();
        const consent = await prisma.consent.create({
            data: {
                userId: req.user!.userId,
                institutionName: appName,
                purpose: `[AUTOFILL] ${purpose}`,
                allowedFields: Array.isArray(allowedFields) ? allowedFields.join(',') : allowedFields,
                consentToken,
                status: 'active',
                expiresAt: new Date(expiresAt),
                accessTier: 1,
            },
        });

        await prisma.activityLog.create({
            data: {
                userId: req.user!.userId,
                eventType: 'consent',
                title: 'Autofill Token Created',
                description: `${appName} authorised for form autofill`,
                entityName: appName,
                entityType: 'autofill',
                consentId: consent.id,
            },
        });

        broadcastToUser(req.user!.userId, 'autofill_token_created', {
            consentId: consent.id,
            appName,
            consentToken,
        });

        res.status(201).json({
            success: true,
            message: 'Autofill token created',
            data: { consentToken, consent },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/autofill/fetch/:token — PUBLIC endpoint called by external apps
// Returns only the allowed fields for the given consent token
// ─────────────────────────────────────────────────────────────────────────────
router.get('/fetch/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const consent = await prisma.consent.findUnique({
            where: { consentToken: req.params.token },
        });

        if (!consent) {
            res.status(404).json({ success: false, message: 'Invalid autofill token' });
            return;
        }

        if (consent.status !== 'active') {
            res.status(403).json({ success: false, message: `Token is ${consent.status}` });
            return;
        }

        if (new Date(consent.expiresAt) < new Date()) {
            await prisma.consent.update({ where: { id: consent.id }, data: { status: 'expired' } });
            res.status(403).json({ success: false, message: 'Token has expired' });
            return;
        }

        // Only serve autofill-purpose tokens
        if (!consent.purpose.startsWith('[AUTOFILL]')) {
            res.status(403).json({ success: false, message: 'This token is not an autofill token' });
            return;
        }

        const allowedFields = consent.allowedFields ? consent.allowedFields.split(',') : [];
        const profile = await buildAutofillProfile(consent.userId, allowedFields);

        // Update access tracking
        await prisma.consent.update({
            where: { id: consent.id },
            data: {
                lastAccessedAt: new Date(),
                accessCount: { increment: 1 },
            },
        });

        await prisma.activityLog.create({
            data: {
                userId: consent.userId,
                eventType: 'consent',
                title: 'Autofill Data Fetched',
                description: `${consent.institutionName} fetched autofill data`,
                entityName: consent.institutionName,
                entityType: 'autofill',
                consentId: consent.id,
                ipAddress: req.ip,
            },
        });

        broadcastToUser(consent.userId, 'autofill_data_fetched', {
            appName: consent.institutionName,
            fieldsAccessed: allowedFields.length,
        });

        res.json({
            success: true,
            source: 'PRISM Identity Vault',
            appName: consent.institutionName,
            data: profile,
            meta: {
                fieldsCount: Object.keys(profile || {}).length,
                expiresAt: consent.expiresAt,
                accessCount: consent.accessCount + 1,
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/autofill/tokens — list all autofill tokens for the user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tokens', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tokens = await prisma.consent.findMany({
            where: {
                userId: req.user!.userId,
                purpose: { startsWith: '[AUTOFILL]' },
            },
            orderBy: { grantedAt: 'desc' },
        });
        res.json({ success: true, data: tokens });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/autofill/tokens/:id/revoke
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/tokens/:id/revoke', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const consent = await prisma.consent.findFirst({
            where: { id: req.params.id, userId: req.user!.userId },
        });
        if (!consent) {
            res.status(404).json({ success: false, message: 'Token not found' });
            return;
        }
        const updated = await prisma.consent.update({
            where: { id: req.params.id },
            data: { status: 'revoked', revokedAt: new Date() },
        });
        res.json({ success: true, message: 'Autofill token revoked', data: updated });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;