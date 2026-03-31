import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const currentEmail = 'Shubhamshah04@gmail.com';
  const targetEmail = 'abc@gmail.com';
  
  // Try to rename the user
  try {
    await prisma.user.update({
      where: { email: currentEmail },
      data: {
        email: targetEmail,
        fullName: 'abc',
        displayName: 'abc',
        profilePhotoUrl: null
      }
    });
    console.log(`Successfully renamed ${currentEmail} to ${targetEmail}`);
  } catch (err: any) {
    console.log(`Could not rename ${currentEmail} (maybe it doesn't exist or ${targetEmail} is taken)`);
    // Fallback: update any user with 'abc@gmail.com' to also have fullName 'abc'
    await prisma.user.updateMany({
      where: { email: targetEmail },
      data: { fullName: 'abc', displayName: 'abc', profilePhotoUrl: null }
    });
  }
}
main().finally(() => prisma.$disconnect());
