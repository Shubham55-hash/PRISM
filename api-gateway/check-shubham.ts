import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { fullName: { contains: 'Shubham' } }
  });
  console.log(`Found ${users.length} users with "Shubham" in their name.`);
  users.forEach(u => console.log(`- ${u.email}: ${u.fullName}`));
}
main().finally(() => prisma.$disconnect());
