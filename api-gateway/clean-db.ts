import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  const documents = await prisma.document.findMany();
  let updatedCount = 0;
  for (const doc of documents) {
    if (doc.ocrExtractedFields) {
      try {
        const fields = JSON.parse(doc.ocrExtractedFields);
        let modified = false;
        
        const toRemove = ['email', 'phone', 'passportNumber', 'panNumber', 'pan', 'passport', 'EMAIL', 'PHONE', 'PASSPORTNUMBER', 'PANNUMBER', 'PASSPORT'];
        
        for (const key of toRemove) {
          if (fields[key] !== undefined) {
            delete fields[key];
            modified = true;
          }
        }

        if (modified) {
          await prisma.document.update({
            where: { id: doc.id },
            data: { ocrExtractedFields: JSON.stringify(fields) }
          });
          updatedCount++;
        }
      } catch (e) {
        console.error('Error parsing doc', doc.id);
      }
    }
  }

  console.log(`Cleaned ${updatedCount} documents.`);
}

clean().catch(console.error).finally(() => prisma.$disconnect());
