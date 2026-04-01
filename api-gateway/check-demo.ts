import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { fullName: { contains: 'Demo' } },
        { email: { contains: 'demo' } }
      ]
    }
  });
  console.log(`Found ${users.length} users matching "Demo".`);
  users.forEach(u => console.log(`- ${u.email}: ${u.fullName} (ID: ${u.prismId})`));
}
main().finally(() => prisma.$disconnect());
