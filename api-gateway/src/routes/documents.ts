import { Router, Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer for local file storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/documents
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, type, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = { userId: req.user!.userId };
    if (search) where.name = { contains: search as string };
    if (type) where.documentType = type;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      documents: documents.map(d => ({
        ...d,
        ocrExtractedFields: d.ocrExtractedFields ? JSON.parse(d.ocrExtractedFields) : null,
        vcProof: d.vcProof ? JSON.parse(d.vcProof) : null,
        sizeFormatted: d.fileSizeBytes ? `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
        dateAdded: new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      })),
      pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), pages: Math.ceil(total / parseInt(limit as string)) },
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/documents/upload
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const { name, documentType } = req.body;
    const docName = name || req.file.originalname;

    // Detect document type from filename if not provided
    const detectedType = documentType || detectDocumentType(req.file.originalname);

    const document = await prisma.document.create({
      data: {
        userId: req.user!.userId,
        name: docName,
        originalFilename: req.file.originalname,
        documentType: detectedType,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        localPath: req.file.filename,
        uploadSource: 'user',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        eventType: 'document',
        title: 'Document Uploaded',
        description: `${docName} added to Document Vault`,
        entityName: docName,
        entityType: detectedType,
        documentId: document.id,
      },
    });

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/documents/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!document) { res.status(404).json({ error: 'Document not found' }); return; }
    res.json({
      ...document,
      ocrExtractedFields: document.ocrExtractedFields ? JSON.parse(document.ocrExtractedFields) : null,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/documents/:id/download
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!document) { res.status(404).json({ error: 'Document not found' }); return; }
    if (document.localPath) {
      const filePath = path.join(uploadDir, document.localPath);
      if (fs.existsSync(filePath)) {
        res.download(filePath, document.originalFilename || document.name);
        return;
      }
    }
    // Return download URL structure for seeded documents
    res.json({ downloadUrl: `/api/documents/${document.id}/stream`, expiresIn: 3600 });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
    if (doc.localPath) {
      const filePath = path.join(uploadDir, doc.localPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.document.delete({ where: { id: req.params.id } });
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, eventType: 'document', title: 'Document Deleted', description: `${doc.name} removed from vault`, entityName: doc.name },
    });
    res.json({ message: 'Document deleted successfully' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/documents/:id/verify (mock W3C VC)
router.post('/:id/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
    const vcCredentialId = `vc:prism:${req.user!.prismId}:${doc.id}`;
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 2);
    const vcProof = {
      type: 'Ed25519Signature2020',
      created: now.toISOString(),
      verificationMethod: `did:prism:${req.user!.prismId}#key-1`,
      jws: Buffer.from(`${vcCredentialId}:${now.getTime()}`).toString('base64'),
    };
    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: { isVerified: true, vcCredentialId, vcIssuedAt: now, vcExpiresAt: expires, vcProof: JSON.stringify(vcProof) },
    });
    await prisma.activityLog.create({
      data: { userId: req.user!.userId, eventType: 'verification', title: 'Document Verified', description: `W3C VC issued for ${doc.name}`, documentId: doc.id },
    });
    res.json({ message: 'Verifiable Credential issued', vcCredentialId, isVerified: true, document: updated });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('passport')) return 'identity';
  if (lower.includes('aadhaar') || lower.includes('aadhar') || lower.includes('pan')) return 'identity';
  if (lower.includes('tax') || lower.includes('itr') || lower.includes('salary') || lower.includes('bank')) return 'financial';
  if (lower.includes('utility') || lower.includes('bill') || lower.includes('rent')) return 'address';
  if (lower.includes('contract') || lower.includes('offer') || lower.includes('employment')) return 'employment';
  if (lower.includes('degree') || lower.includes('certificate') || lower.includes('marksheet')) return 'education';
  if (lower.includes('medical') || lower.includes('prescription') || lower.includes('health')) return 'medical';
  return 'other';
}

export default router;
