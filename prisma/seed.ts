import { PrismaClient } from '@prisma/client';
// reference a type from the generated Prisma Client
// import type { Client } from '@prisma/client';
const prisma: PrismaClient = new PrismaClient();
import { Client } from './types.ts';

// if you use the model you have to fill in all the fields also the generated ones
const clients: Client[] = [
  {
    name: 'Jane Doe',
    email: 'jane@doe.com',
  },
  {
    name: 'John Doe',
    email: 'john@doe.com',
  },
  {
    name: 'Mary Jane',
    email: 'mary@jane.com',
  },
];

// first look if the exist in the database and then add them

const load = async (): Promise<void> => {
  try {
    await prisma.client.createMany({
      data: clients,
    });
    console.log('Added category data');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

load();
