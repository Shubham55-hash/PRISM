import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USER LIST ---');
  for (const u of users) {
    console.log(`EMAIL=[${u.email}] NAME=[${u.fullName}] ID=[${u.id}] PHOTO=[${u.profilePhotoUrl}]`);
  }
}
main().finally(() => prisma.$disconnect());
