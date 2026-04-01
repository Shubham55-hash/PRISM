import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('--- GLOBAL RESET TO ABC ---');
  
  // Wipe all names and photos to 'abc' for everyone in the DB
  const updateResult = await prisma.user.updateMany({
    data: {
      fullName: 'Demo User',
      displayName: 'Demo',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
      addressLine: '123 Innovation Way',
      city: 'Mumbai',
      state: 'MH',
      dateOfBirth: '1990-01-01',
    }
  });
  console.log(`Updated ${updateResult.count} users.`);

  // If there's an account with 'Shubhamshah04@gmail.com', let's also rename its actual email to abc@gmail.com
  // as the user mentioned "email abc@gmail.com".
  try {
    await prisma.user.update({
      where: { email: 'Shubhamshah04@gmail.com' },
      data: { email: 'demo@prism.io' }
    });
    console.log('Renamed Shubhamshah04@gmail.com account email to demo@prism.io');
  } catch (e) {
    console.log('Shubhamshah04@gmail.com not found or demo@prism.io already taken.');
  }

  const finalUsers = await prisma.user.findMany();
  console.log('FINAL USER STATES:');
  finalUsers.forEach(u => {
    console.log(`EMAIL=[${u.email}] NAME=[${u.fullName}] ID=[${u.id}]`);
  });
}
main().finally(() => prisma.$disconnect());
