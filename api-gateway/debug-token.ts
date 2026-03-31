import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db"
    }
  }
});

async function main() {
  const token = '0c6e7848-c9cf-42ab-9287-874fd1f8e4a7';
  console.log(`Checking token: ${token}`);

  const consent = await prisma.consent.findUnique({
    where: { consentToken: token }
  });

  if (consent) {
    console.log('Consent found:');
    console.log(JSON.stringify(consent, null, 2));
    const now = new Date();
    const expiresAt = new Date(consent.expiresAt);
    console.log(`Status: ${consent.status}`);
    console.log(`Expires At: ${consent.expiresAt}`);
    console.log(`Current Time: ${now.toISOString()}`);
    console.log(`Is Expired: ${expiresAt < now}`);
    console.log(`Purpose: ${consent.purpose}`);
  } else {
    console.log('Token NOT found in database.');
    
    // Let's see some existing tokens just in case
    const allTokens = await prisma.consent.findMany({
        where: { purpose: { startsWith: '[AUTOFILL]' } },
        take: 5
    });
    console.log('Existing autofill tokens:', allTokens.map(t => t.consentToken));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
