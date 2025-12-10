import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Deleting all clients from the database...');
    const deleted = await prisma.client.deleteMany({});
    console.log('Deleted rows:', deleted.count);
  } catch (err) {
    console.error('Failed to reset DB', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
