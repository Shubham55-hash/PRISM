import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('--- GLOBAL RESET TO ABC ---');
  
  // Wipe all names and photos to 'abc' for everyone in the DB
  const updateResult = await prisma.user.updateMany({
    data: {
      fullName: 'abc',
      displayName: 'abc',
      profilePhotoUrl: null,
      addressLine: null,
      city: 'abc',
      state: 'abc',
      dateOfBirth: null,
    }
  });
  console.log(`Updated ${updateResult.count} users.`);

  // If there's an account with 'Shubhamshah04@gmail.com', let's also rename its actual email to abc@gmail.com
  // as the user mentioned "email abc@gmail.com".
  try {
    await prisma.user.update({
      where: { email: 'Shubhamshah04@gmail.com' },
      data: { email: 'abc@gmail.com' }
    });
    console.log('Renamed Shubhamshah04@gmail.com account email to abc@gmail.com');
  } catch (e) {
    console.log('Shubhamshah04@gmail.com not found or abc@gmail.com already taken.');
  }

  const finalUsers = await prisma.user.findMany();
  console.log('FINAL USER STATES:');
  finalUsers.forEach(u => {
    console.log(`EMAIL=[${u.email}] NAME=[${u.fullName}] ID=[${u.id}]`);
  });
}
main().finally(() => prisma.$disconnect());
