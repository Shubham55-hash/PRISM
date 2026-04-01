import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'prism-super-secret-jwt-key-2024-india-256bit';

async function main() {
  console.log('🌱 Seeding PRISM database...\n');

  // Clean existing data
  await prisma.lifeStagePrediction.deleteMany();
  await prisma.trustScoreHistory.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  // ── Demo User ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('prism2024', 12);
  const user = await prisma.user.create({
    data: {
      prismId: 'PR-000-DEMO-X',
      fullName: 'Shubham Alpesh Shah',
      displayName: 'Shubham',
      email: 'demo@prism.io',
      phone: '+91 00000 00000',
      passwordHash,
      dateOfBirth: '1990-01-01',
      addressLine: '123 Innovation Way, Tech Park',
      city: 'Mumbai',
      state: 'MH',
      abhaId: 'ABHA-DEMO-0000-00',
      digilockerLinked: true,
      biometricStatus: 'active',
      securityTier: 3,
      trustScore: 95,
      pendingRequests: 0,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
    },
  });
  console.log(`✅ Created user: ${user.fullName} (${user.prismId})`);

  // ── Institutions ───────────────────────────────────────────────────────────
  const institutions = await prisma.institution.createMany({
    data: [
      { name: 'Zenith Corp HR', type: 'employer', isVerifiedPartner: true, logoUrl: 'https://logo.clearbit.com/zenith.com' },
      { name: 'Global Heritage Bank', type: 'bank', isVerifiedPartner: true, logoUrl: 'https://logo.clearbit.com/hsbc.com' },
      { name: 'HealthFirst Insurance', type: 'hospital', isVerifiedPartner: true, logoUrl: 'https://logo.clearbit.com/aetna.com' },
      { name: 'SafeRent Properties', type: 'employer', isVerifiedPartner: false, logoUrl: 'https://logo.clearbit.com/zillow.com' },
      { name: 'DigiLocker', type: 'government', isVerifiedPartner: true, logoUrl: 'https://logo.clearbit.com/digilocker.gov.in' },
    ],
  });
  console.log(`✅ Created ${institutions.count} institutions`);

  // ── Documents ──────────────────────────────────────────────────────────────
  const now = new Date();
  const documents = [
    { name: 'Passport_Scan_Main.pdf', documentType: 'identity', fileSizeBytes: 2516582, mimeType: 'application/pdf', isVerified: true, uploadSource: 'digilocker', daysAgo: 19 },
    { name: 'Tax_Return_2023.pdf', documentType: 'financial', fileSizeBytes: 1153434, mimeType: 'application/pdf', isVerified: true, uploadSource: 'user', daysAgo: 1 },
    { name: 'Utility_Bill_Feb.pdf', documentType: 'address', fileSizeBytes: 838860, mimeType: 'application/pdf', isVerified: false, uploadSource: 'user', daysAgo: 31 },
    { name: 'Employment_Contract.pdf', documentType: 'employment', fileSizeBytes: 4404019, mimeType: 'application/pdf', isVerified: true, uploadSource: 'user', daysAgo: 75 },
    { name: 'Degree_Certificate.pdf', documentType: 'education', fileSizeBytes: 3670016, mimeType: 'application/pdf', isVerified: true, uploadSource: 'digilocker', daysAgo: 111 },
    { name: 'PAN_Card.pdf', documentType: 'identity', fileSizeBytes: 524288, mimeType: 'application/pdf', isVerified: true, uploadSource: 'digilocker', daysAgo: 120 },
    { name: 'Bank_Statement_Jan24.pdf', documentType: 'financial', fileSizeBytes: 1048576, mimeType: 'application/pdf', isVerified: false, uploadSource: 'user', daysAgo: 55 },
    { name: 'Aadhaar_Card.pdf', documentType: 'identity', fileSizeBytes: 729088, mimeType: 'application/pdf', isVerified: true, uploadSource: 'digilocker', daysAgo: 200 },
    { name: 'Health_Insurance_Policy.pdf', documentType: 'medical', fileSizeBytes: 2097152, mimeType: 'application/pdf', isVerified: true, uploadSource: 'user', daysAgo: 45 },
    { name: 'Salary_Slip_Feb24.pdf', documentType: 'financial', fileSizeBytes: 409600, mimeType: 'application/pdf', isVerified: false, uploadSource: 'user', daysAgo: 30 },
    { name: 'Driving_Licence.pdf', documentType: 'identity', fileSizeBytes: 614400, mimeType: 'application/pdf', isVerified: true, uploadSource: 'digilocker', daysAgo: 250 },
    { name: 'Property_Documents.pdf', documentType: 'address', fileSizeBytes: 5242880, mimeType: 'application/pdf', isVerified: false, uploadSource: 'user', daysAgo: 10 },
  ];

  const createdDocs = [];
  for (const doc of documents) {
    const docDate = new Date(now);
    docDate.setDate(docDate.getDate() - doc.daysAgo);
    const vcData = doc.isVerified ? {
      vcCredentialId: `vc:prism:PR-000-DEMO-X:${uuidv4().slice(0, 8)}`,
      vcIssuedAt: docDate,
      vcExpiresAt: new Date(docDate.getFullYear() + 2, docDate.getMonth(), docDate.getDate()),
      vcProof: JSON.stringify({
        type: 'Ed25519Signature2020',
        created: docDate.toISOString(),
        verificationMethod: 'did:prism:PR-000-DEMO-X#key-1',
        jws: Buffer.from(`vc:${doc.name}:${docDate.getTime()}`).toString('base64'),
      }),
    } : {};

    const created = await prisma.document.create({
      data: {
        userId: user.id,
        name: doc.name,
        originalFilename: doc.name,
        documentType: doc.documentType,
        fileSizeBytes: doc.fileSizeBytes,
        mimeType: doc.mimeType,
        isVerified: doc.isVerified,
        uploadSource: doc.uploadSource,
        ocrExtractedFields: JSON.stringify({
          fullName: 'Shubham Alpesh Shah',
          dateOfBirth: '05 OCT 2006',
          aadhaarNumber: 'xxxxxxxx9092',
          panNumber: 'ABCPS1234F',
          gender: 'Male',
          dob: '05-10-2006'
        }),
        createdAt: docDate,
        ...vcData,
      },
    });
    createdDocs.push(created);
  }
  console.log(`✅ Created ${createdDocs.length} documents`);

  // ── Consents ───────────────────────────────────────────────────────────────
  const makeConsentToken = (payload: any) => jwt.sign(payload, JWT_SECRET);

  const consentsData = [
    { name: 'Zenith Corp HR', purpose: 'Employment Onboarding KYC', tier: 2, fields: 'name,dob,address,employment', status: 'active', daysAgo: 19, expiryDays: 90, logo: 'https://logo.clearbit.com/zenith.com' },
    { name: 'Global Heritage Bank', purpose: 'KYC Verification & Account Opening', tier: 2, fields: 'name,dob,address,pan', status: 'active', daysAgo: 21, expiryDays: 180, logo: 'https://logo.clearbit.com/hsbc.com' },
    { name: 'HealthFirst Insurance', purpose: 'Policy Issuance & Medical History', tier: 3, fields: 'name,dob,abha,medical_history', status: 'active', daysAgo: 70, expiryDays: 365, logo: 'https://logo.clearbit.com/aetna.com' },
    { name: 'SafeRent Properties', purpose: 'Rental Application Verification', tier: 1, fields: 'name,address,income', status: 'expired', daysAgo: 44, expiryDays: -1, logo: 'https://logo.clearbit.com/zillow.com' },
    { name: 'MutualWealth AMC', purpose: 'Investment Account KYC', tier: 2, fields: 'name,dob,pan,address', status: 'active', daysAgo: 90, expiryDays: 365, logo: 'https://logo.clearbit.com/vanguard.com' },
    { name: 'GreenPath Realty', purpose: 'Home Loan Pre-approval', tier: 2, fields: 'name,dob,income,bank_statement', status: 'active', daysAgo: 5, expiryDays: 60, logo: 'https://logo.clearbit.com/redfin.com' },
    { name: 'Apollo Hospitals', purpose: 'Patient Registration & Medical Access', tier: 3, fields: 'name,dob,abha,allergies,blood_group', status: 'active', daysAgo: 30, expiryDays: 365, logo: 'https://logo.clearbit.com/apollohospitals.com' },
    { name: 'Prestige University', purpose: 'Alumni Verification for Background Check', tier: 1, fields: 'name,degree,graduation_year', status: 'active', daysAgo: 100, expiryDays: 730, logo: 'https://logo.clearbit.com/cambridge.org' },
  ];

  for (const c of consentsData) {
    const grantedAt = new Date(now);
    grantedAt.setDate(grantedAt.getDate() - c.daysAgo);
    const expiresAt = new Date(grantedAt);
    expiresAt.setDate(expiresAt.getDate() + c.expiryDays);
    const consentId = uuidv4();
    const consentToken = makeConsentToken({
      consentId,
      userId: user.id,
      institutionId: c.name.toLowerCase().replace(/\s/g, '_'),
      allowedFields: c.fields.split(','),
      accessTier: c.tier,
      purpose: c.purpose,
      issuedAt: Math.floor(grantedAt.getTime() / 1000),
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
      readOnly: true,
    });
    await prisma.consent.create({
      data: {
        userId: user.id,
        institutionName: c.name,
        institutionId: c.name.toLowerCase().replace(/\s/g, '_'),
        purpose: c.purpose,
        accessTier: c.tier,
        allowedFields: c.fields,
        consentToken,
        status: c.status,
        expiresAt,
        grantedAt,
        institutionLogoUrl: c.logo,
        accessCount: Math.floor(Math.random() * 20),
        lastAccessedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ Created ${consentsData.length} consents`);

  // ── Activity Log ───────────────────────────────────────────────────────────
  const activities = [
    { daysAgo: 0, hoursAgo: 2, type: 'verification', title: 'Employment Verification Complete', desc: 'A digital signature was provided to Zenith Corp HR for onboarding.', entity: 'Zenith Corp HR', entityType: 'employer' },
    { daysAgo: 1, hoursAgo: 0, type: 'document', title: 'New Document Uploaded', desc: 'Tax_Return_2023.pdf was added to your Financial vault.', entity: 'Financial Vault', entityType: 'document' },
    { daysAgo: 3, hoursAgo: 0, type: 'consent', title: 'KYC Refresh Request', desc: 'Identity verification requested by Global Heritage Bank.', entity: 'Global Heritage Bank', entityType: 'bank' },
    { daysAgo: 7, hoursAgo: 0, type: 'verification', title: 'Address Verified', desc: 'Physical residency confirmed via DigiLocker.', entity: 'DigiLocker', entityType: 'government' },
    { daysAgo: 14, hoursAgo: 0, type: 'security', title: 'New Device Authorized', desc: 'iPhone 15 Pro logged in from Mumbai.', entity: 'iPhone 15 Pro', entityType: 'device' },
    { daysAgo: 30, hoursAgo: 0, type: 'consent', title: 'Consent Revoked', desc: 'Access revoked from SafeRent Properties.', entity: 'SafeRent Properties', entityType: 'employer' },
    { daysAgo: 45, hoursAgo: 0, type: 'verification', title: 'Health Insurance Linked', desc: 'HealthFirst Insurance now connected to your ABHA profile.', entity: 'HealthFirst Insurance', entityType: 'hospital' },
    { daysAgo: 60, hoursAgo: 0, type: 'document', title: 'Degree Certificate Verified', desc: 'W3C Verifiable Credential issued for Degree_Certificate.pdf.', entity: 'PRISM Verifier', entityType: 'system' },
    { daysAgo: 75, hoursAgo: 0, type: 'document', title: 'Employment Contract Uploaded', desc: 'Employment_Contract.pdf processed and signed.', entity: 'Document Vault', entityType: 'document' },
    { daysAgo: 90, hoursAgo: 0, type: 'consent', title: 'Investment KYC Consented', desc: 'MutualWealth AMC connected for investment account.', entity: 'MutualWealth AMC', entityType: 'bank' },
    { daysAgo: 5, hoursAgo: 4, type: 'document', title: 'Property Documents Uploaded', desc: 'Property_Documents.pdf uploaded for home loan pre-approval.', entity: 'Document Vault', entityType: 'document' },
    { daysAgo: 5, hoursAgo: 6, type: 'consent', title: 'Home Loan Consent Granted', desc: 'GreenPath Realty connected for home loan pre-approval.', entity: 'GreenPath Realty', entityType: 'employer' },
  ];

  for (const a of activities) {
    const ts = new Date(now);
    ts.setDate(ts.getDate() - a.daysAgo);
    ts.setHours(ts.getHours() - a.hoursAgo);
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        eventType: a.type,
        title: a.title,
        description: a.desc,
        entityName: a.entity,
        entityType: a.entityType,
        createdAt: ts,
      },
    });
  }
  console.log(`✅ Created ${activities.length} activity logs`);

  // ── Trust Score History ────────────────────────────────────────────────────
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const scores = [85, 87, 86, 89, 91, 92];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const year = currentYear - (currentMonth - i < 0 ? 1 : 0);
    await prisma.trustScoreHistory.create({
      data: {
        userId: user.id,
        score: scores[5 - i],
        month: months[monthIndex],
        year,
        scoreBreakdown: JSON.stringify({ identity: 28, documents: 23, consents: 18, activity: 14, security: scores[5 - i] - 83 }),
      },
    });
  }
  console.log(`✅ Created 6 months trust score history`);

  // ── Life Stage Predictions ─────────────────────────────────────────────────
  await prisma.lifeStagePrediction.create({
    data: {
      userId: user.id,
      predictedStage: 'home_loan',
      title: 'Home Loan Application Bundle',
      description: 'Property documents and bank statements detected. PRISM can auto-prepare your complete home loan credential pack for GreenPath Realty.',
      confidence: 0.87,
      suggestedBundle: JSON.stringify(['income_proof', 'bank_statements_6mo', 'aadhaar', 'pan', 'property_docs']),
    },
  });
  console.log(`✅ Created life stage prediction`);

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('   Email:    demo@prism.io');
  console.log('   Password: prism2024');
  console.log('   PRISM ID: PR-000-DEMO-X\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
