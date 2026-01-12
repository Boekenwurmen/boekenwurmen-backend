import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// reference a type from the generated Prisma Client
// import type { Client } from '@prisma/client';
const prisma: PrismaClient = new PrismaClient();
import { Client } from './types.ts';
import * as booksData from '../src/assets/books/books.json' with { type: 'json' };

// if you use the model you have to fill in all the fields also the generated ones
const clients: Client[] = [
  {
    name: 'test',
    code: '12345678910',
  },
];

// Default admin account
const admins = [
  {
    email: 'admin@boekenwurmen.nl',
    password: '123456', 
    name: 'Admin',
    role: 'admin',
  },
];

// first look if the exist in the database and then add them

const load = async (): Promise<void> => {
  try {
    // Seed clients
    for (const c of clients) {
      const hashed = c.code ? await bcrypt.hash(c.code, 10) : null;
      await prisma.client.upsert({
        where: { name: c.name },
        update: { code: hashed ?? undefined },
        create: { name: c.name, code: hashed ?? undefined },
      });
    }
    console.log('Seeded clients');

    // Seed stories from JSON into the database
    const books: any[] = (booksData as any)?.default?.books ?? (booksData as any)?.books ?? [];
    for (let bookIdx = 0; bookIdx < books.length; bookIdx++) {
      const book = books[bookIdx];
      const pages: any[] = book?.pages ?? [];
      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        const content: string = page?.story ?? '';
        const type: string | undefined = page?.type;
        if (content) {
          await prisma.story.upsert({
            where: { bookId_pageId: { bookId: bookIdx, pageId: pageIdx } },
            update: { content, type },
            create: { bookId: bookIdx, pageId: pageIdx, content, type },
          });
        }
      }
    }
    console.log('Seeded stories from JSON');
    // Seed admins
    for (const a of admins) {
      const hashed = await bcrypt.hash(a.password, 10);
      await prisma.admin.upsert({
        where: { email: a.email },
        update: { password: hashed, name: a.name, role: a.role },
        create: { email: a.email, password: hashed, name: a.name, role: a.role },
      });
    }
    console.log('Seeded admins');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

load();
