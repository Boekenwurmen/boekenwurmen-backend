import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// reference a type from the generated Prisma Client
// import type { Client } from '@prisma/client';
const prisma: PrismaClient = new PrismaClient();
import { Client } from './types.ts';

// if you use the model you have to fill in all the fields also the generated ones
const clients: Client[] = [
  {
    name: 'test',
    code: '12345678910',
  },
];

// first look if the exist in the database and then add them

const load = async (): Promise<void> => {
  try {
    for (const c of clients) {
      const hashed = c.code ? await bcrypt.hash(c.code, 10) : null;
      await prisma.client.upsert({
        where: { name: c.name },
        update: { code: hashed ?? undefined },
        create: { name: c.name, code: hashed ?? undefined },
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
