import { PrismaClient } from '@prisma/client';
// reference a type from the generated Prisma Client
// import type { Client } from '@prisma/client';
const prisma: PrismaClient = new PrismaClient();
import { Client } from './types.ts';

// if you use the model you have to fill in all the fields also the generated ones
const clients: Client[] = [
  {
    name: 'test',
    code: 'test',
  },
];

// first look if the exist in the database and then add them

const load = async (): Promise<void> => {
  try {
    for (const c of clients) {
      await prisma.client.upsert({
        where: { name: c.name },
        update: { code: c.code },
        create: c,
      });
    }
    console.log('Seeded clients');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

load();
