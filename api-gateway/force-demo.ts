import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const targetEmail = 'demo@prism.io';
  const shubhamEmail = 'Shubhamshah04@gmail.com';
  
  try {
    await prisma.user.update({
      where: { email: shubhamEmail },
      data: {
        email: targetEmail,
        fullName: 'Demo User',
        displayName: 'Demo',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200'
      }
    });
    console.log(`Successfully renamed ${shubhamEmail} to ${targetEmail}`);
  } catch (err: any) {
    console.log(`Could not rename ${shubhamEmail} (maybe it doesn't exist or ${targetEmail} is taken)`);
    // Fallback: update any existing demo user
    await prisma.user.updateMany({
      where: { email: targetEmail },
      data: { 
        fullName: 'Demo User', 
        displayName: 'Demo',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200'
      }
    });
  }
}
main().finally(() => prisma.$disconnect());
