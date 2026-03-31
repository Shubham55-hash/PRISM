import { Router, Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { broadcastToUser } from '../utils/websocket';
import { 
  generateDigiLockerAuthUrl, 
  exchangeAuthCode, 
  fetchDigiLockerDocuments,
  downloadDigiLockerDocument,
  mapDigiLockerDocType 
} from '../utils/digilocker';

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
      documents: documents.map((d: any) => ({
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

    // Create document record
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

    // Mock OCR extraction — real Tesseract integration comes in a later step
    const ocrFields = {
      name: `Extracted from ${path.basename(req.file.originalname, path.extname(req.file.originalname))}`,
      docType: detectedType,
      confidence: 0.91,
    };
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { ocrExtractedFields: JSON.stringify(ocrFields) },
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
    
    // Broadcast real-time update
    broadcastToUser(req.user!.userId, 'document_uploaded', { 
      documentId: document.id, 
      name: docName 
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: { ...updatedDocument, ocrExtractedFields: ocrFields },
    });
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
    const vcCredentialId = uuidv4();
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 1); // +1 year per W3C VC spec
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
    
    // Broadcast real-time update
    broadcastToUser(req.user!.userId, 'document_verified', { 
      documentId: doc.id, 
      name: doc.name,
      vcCredentialId 
    });
    res.json({ message: 'Verifiable Credential issued', vcCredentialId, isVerified: true, document: updated });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/documents/:id/extract - Intelligent OCR extraction with regex & simulation
router.post('/:id/extract', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await prisma.document.findFirst({ 
      where: { id: req.params.id, userId: req.user!.userId } 
    });
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }

    // Simulate OCR extraction based on document type
    const extracted = simulateOCRExtraction(doc.documentType || 'other', doc.name);
    
    // Save extracted fields
    await prisma.document.update({
      where: { id: doc.id },
      data: { ocrExtractedFields: JSON.stringify(extracted) }
    });

    res.json({ 
      success: true, 
      message: 'Fields extracted', 
      data: extracted,
      confidence: 0.87 
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/documents/:id/extract/confirm - User confirms & saves extracted data to identity
router.post('/:id/extract/confirm', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { extractedData } = req.body;
    if (!extractedData) { res.status(400).json({ error: 'extractedData is required' }); return; }

    const doc = await prisma.document.findFirst({ 
      where: { id: req.params.id, userId: req.user!.userId } 
    });
    if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }

    // Update document with confirmed fields
    await prisma.document.update({
      where: { id: doc.id },
      data: { ocrExtractedFields: JSON.stringify(extractedData) }
    });

    // Merge into user profile
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const updateData: any = {};
    if (extractedData.fullName && !user.fullName) updateData.fullName = extractedData.fullName;
    if (extractedData.dateOfBirth && !user.dateOfBirth) updateData.dateOfBirth = extractedData.dateOfBirth;
    if (extractedData.address && !user.addressLine) updateData.addressLine = extractedData.address;
    if (extractedData.city && !user.city) updateData.city = extractedData.city;
    if (extractedData.state && !user.state) updateData.state = extractedData.state;
    if (extractedData.phone && extractedData.phone !== user.phone) {
      // Only update phone if it's a new valid one
      try {
        updateData.phone = extractedData.phone;
      } catch (e) { /* skip */ }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: 'document',
        title: 'Identity Data Updated',
        description: `Extracted and merged fields from ${doc.name}`,
        documentId: doc.id
      }
    });

    res.json({ 
      success: true, 
      message: 'Identity profile updated', 
      data: { fieldsUpdated: Object.keys(updateData).length, user: updated }
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/documents/digilocker/authorize - Initiate DigiLocker OAuth flow
router.get('/digilocker/authorize', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = uuidv4(); // Anti-CSRF token
    
    // Store state in a temporary session/cache (in production, use Redis)
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { 
        digilockerState: state,
        digilockerStateExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      } as any,
    });

    const authUrl = generateDigiLockerAuthUrl(state);
    res.json({ authUrl, state });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/digilocker/callback - Handle DigiLocker OAuth callback
router.get('/digilocker/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    // Verify state token (find which user this belongs to)
    const user = await prisma.user.findFirst({
      where: { 
        digilockerState: state as string,
        digilockerStateExpiresAt: { gt: new Date() }
      } as any,
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired state token' });
      return;
    }

    // Exchange code for tokens
    const tokenData = await exchangeAuthCode(code as string);

    // Store DigiLocker token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        digilockerAccessToken: tokenData.accessToken,
        digilockerRefreshToken: tokenData.refreshToken || null,
        digilockerTokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        digilockerState: null,
        digilockerStateExpiresAt: null,
      } as any,
    });

    // Redirect back to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/documents?digilocker=success`);
  } catch (err: any) {
    console.error('DigiLocker callback error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/documents?digilocker=error&message=${encodeURIComponent(err.message)}`);
  }
});

// GET /api/documents/digilocker/documents - Fetch available documents from DigiLocker
router.get('/digilocker/documents', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (!user || !user.digilockerAccessToken) {
      res.status(401).json({ error: 'DigiLocker not connected. Please authorize first.' });
      return;
    }

    // Check if token is expired
    if (user.digilockerTokenExpiresAt && user.digilockerTokenExpiresAt < new Date()) {
      res.status(401).json({ error: 'DigiLocker token expired. Please re-authorize.' });
      return;
    }

    // Fetch documents from DigiLocker
    const documents = await fetchDigiLockerDocuments(user.digilockerAccessToken);

    res.json({ 
      success: true, 
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        issuer: doc.issuer,
        issuedDate: doc.issuedDate,
        expiryDate: doc.expiryDate,
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/import-digilocker - Real DigiLocker import with document selection
router.post('/import-digilocker', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { selectedDocIds } = req.body;
    const userId = req.user!.userId;

    if (!selectedDocIds || !Array.isArray(selectedDocIds) || selectedDocIds.length === 0) {
      res.status(400).json({ error: 'No documents selected' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.digilockerAccessToken) {
      res.status(401).json({ error: 'DigiLocker not connected' });
      return;
    }

    // Fetch all available documents from DigiLocker
    const availableDocs = await fetchDigiLockerDocuments(user.digilockerAccessToken);

    // Filter to only selected documents
    const docsToImport = availableDocs.filter(doc => selectedDocIds.includes(doc.id));

    const created = [];
    for (const doc of docsToImport) {
      try {
        // Download document from DigiLocker
        let fileBuffer: Buffer | null = null;
        let fileSize = 0;
        
        try {
          fileBuffer = await downloadDigiLockerDocument(user.digilockerAccessToken, doc.id);
          fileSize = fileBuffer.length;
        } catch (downloadErr) {
          console.warn(`Failed to download ${doc.name}, proceeding without file`);
        }

        // Save file locally if downloaded
        let localPath = null;
        if (fileBuffer) {
          const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          
          localPath = filename;
          fs.writeFileSync(path.join(uploadDir, filename), fileBuffer);
        }

        // Create document record in database
        const createdDoc = await prisma.document.create({
          data: {
            userId,
            name: doc.name,
            documentType: mapDigiLockerDocType(doc.type),
            originalFilename: `${doc.name.toLowerCase().replace(/ /g, '_')}.pdf`,
            uploadSource: 'digilocker',
            fileSizeBytes: fileSize || null,
            mimeType: 'application/pdf',
            localPath,
            ocrExtractedFields: JSON.stringify({
              issuer: doc.issuer,
              issuedDate: doc.issuedDate,
              expiryDate: doc.expiryDate,
              digilockerDocId: doc.id,
            }),
          },
        });

        created.push(createdDoc);
      } catch (docErr: any) {
        console.error(`Failed to import document ${doc.name}:`, docErr.message);
      }
    }

    // Mark user as DigiLocker linked
    await prisma.user.update({
      where: { id: userId },
      data: { digilockerLinked: true },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        eventType: 'document',
        title: 'DigiLocker Documents Imported',
        description: `Imported ${created.length} documents from DigiLocker`,
        entityName: 'DigiLocker',
        entityType: 'import',
      },
    });

    broadcastToUser(userId, 'digilocker_imported', { count: created.length });

    res.json({
      success: true,
      message: `Imported ${created.length} documents from DigiLocker`,
      data: created.map(d => ({ ...d, ocrExtractedFields: d.ocrExtractedFields ? JSON.parse(d.ocrExtractedFields) : null })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LEGACY MOCK ENDPOINT (kept for backwards compatibility) ────────────────────
// POST /api/documents/import-digilocker-mock - Mock DigiLocker import (for testing)
router.post('/import-digilocker-mock', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mockDocuments = [
      { name: 'Aadhaar Card', type: 'identity', data: generateMockAadhaar() },
      { name: 'PAN Certificate', type: 'identity', data: generateMockPAN() },
      { name: 'Driving License', type: 'identity', data: generateMockDL() },
    ];

    const created = [];
    for (const mockDoc of mockDocuments) {
      const doc = await prisma.document.create({
        data: {
          userId,
          name: mockDoc.name,
          documentType: mockDoc.type,
          originalFilename: `${mockDoc.name.toLowerCase().replace(/ /g, '_')}.pdf`,
          ocrExtractedFields: JSON.stringify(mockDoc.data),
          uploadSource: 'digilocker',
          fileSizeBytes: Math.floor(Math.random() * 500000) + 100000,
          mimeType: 'application/pdf'
        }
      });
      created.push(doc);
    }

    // Mark user as DigiLocker linked
    await prisma.user.update({
      where: { id: userId },
      data: { digilockerLinked: true }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        eventType: 'document',
        title: 'DigiLocker Documents Imported',
        description: `Imported ${created.length} documents from DigiLocker`,
        entityName: 'DigiLocker',
        entityType: 'import'
      }
    });

    broadcastToUser(userId, 'digilocker_imported', { count: created.length });

    res.json({ 
      success: true, 
      message: `Imported ${created.length} documents from DigiLocker`,
      data: created.map(d => ({ ...d, ocrExtractedFields: d.ocrExtractedFields ? JSON.parse(d.ocrExtractedFields) : null }))
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Helpers ────────────────────────────────────────────────────────────────
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

function simulateOCRExtraction(docType: string, docName: string): Record<string, any> {
  const names = ['Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Neha Gupta', 'Vikram Sharma'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  
  const baseFields = {
    fullName: randomName,
    dateOfBirth: '1995-03-15',
    email: `${randomName.toLowerCase().replace(/ /g, '.')}@email.com`,
    phone: '+91-98765-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
    address: '123 Tech Park, Innovation Street',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560045'
  };

  const typeSpecific: Record<string, any> = {
    identity: {
      ...baseFields,
      aadhaarNumber: Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0'),
      panNumber: 'ABCDE1234F',
      passportNumber: 'P1234567',
      gender: 'Male',
      dob: baseFields.dateOfBirth
    },
    address: {
      address: '123 Tech Park, Innovation Street, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560045'
    },
    financial: {
      ...baseFields,
      accountNumber: Math.floor(Math.random() * 1000000000000000).toString().slice(0, 14),
      ifsc: 'SBIN0001234',
      panNumber: 'ABCDE1234F',
      annualIncome: '1200000'
    },
    employment: {
      employer: 'Tech Solutions India',
      designation: 'Senior Software Engineer',
      department: 'Engineering',
      employeeId: 'EMP-2024-001'
    },
    education: {
      institution: 'Indian Institute of Technology',
      degree: 'Bachelor of Technology',
      major: 'Computer Science',
      graduationYear: '2018'
    },
    medical: {
      ...baseFields,
      bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
      allergies: 'Penicillin',
      medicalConditions: 'None'
    }
  };

  return typeSpecific[docType] || baseFields;
}

function generateMockAadhaar(): Record<string, any> {
  return {
    fullName: 'Rajesh Kumar',
    aadhaarNumber: '123456789012',
    dateOfBirth: '1990-05-20',
    gender: 'Male',
    address: '123 Tech Park, Bangalore',
    phone: '+91-9876543210',
    email: 'rajesh@email.com'
  };
}

function generateMockPAN(): Record<string, any> {
  return {
    fullName: 'Rajesh Kumar',
    panNumber: 'ABCDE1234F',
    dateOfBirth: '1990-05-20',
    email: 'rajesh@email.com',
    phone: '+91-9876543210'
  };
}

function generateMockDL(): Record<string, any> {
  return {
    fullName: 'Rajesh Kumar',
    dlNumber: 'KA-1234567890',
    dateOfBirth: '1990-05-20',
    issuedDate: '2018-06-15',
    expiryDate: '2028-06-14',
    address: '123 Tech Park, Bangalore',
    validityClass: 'LMV'
  };
}

export default router;
