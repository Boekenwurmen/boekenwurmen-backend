import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOKS_FILE_PATH = path.join(__dirname, '../assets/books/books.json');

interface BookMetadata {
  title: string;
  description: string;
  author: string;
  co_authors?: string[];
  cover_image_url: string;
  creation_date: string;
  category: string;
}

interface PageOption {
  toPage: number;
  type: string;
  name: string;
}

interface BookPage {
  story: string;
  type: string;
  options: PageOption[];
}

interface Book {
  metadata: BookMetadata;
  pages: BookPage[];
}

interface BooksData {
  introduction_book: number;
  books: Book[];
}

/**
 * Read books data from JSON file
 */
function readBooksData(): BooksData {
  const data = fs.readFileSync(BOOKS_FILE_PATH, 'utf-8');
  return JSON.parse(data);
}

/**
 * Write books data to JSON file
 */
function writeBooksData(data: BooksData): void {
  fs.writeFileSync(BOOKS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Count endings in a book
 */
function countEndings(pages: BookPage[]): { goodEndings: number; badEndings: number } {
  let goodEndings = 0;
  let badEndings = 0;
  
  pages.forEach(page => {
    page.options.forEach(opt => {
      if (opt.type === 'good ending' || opt.type === 'ending') {
        goodEndings++;
      } else if (opt.type === 'bad ending') {
        badEndings++;
      }
    });
  });
  
  return { goodEndings, badEndings };
}

/**
 * Get all books (admin view with full data)
 */
export async function adminGetBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booksData = readBooksData();
    res.json({
      success: true,
      meta: { count: booksData.books.length },
      introductionBook: booksData.introduction_book,
      data: booksData.books.map((book, index) => {
        const { goodEndings, badEndings } = countEndings(book.pages);
        return {
          id: index,
          title: book.metadata.title,
          description: book.metadata.description,
          author: book.metadata.author,
          coAuthors: book.metadata.co_authors,
          coverImageUrl: book.metadata.cover_image_url,
          createdAt: book.metadata.creation_date,
          category: book.metadata.category,
          pageCount: book.pages.length,
          goodEndings,
          badEndings,
          isIntroduction: index === booksData.introduction_book,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single book with all pages (admin view)
 */
export async function adminGetBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    const book = booksData.books[bookId];
    const { goodEndings, badEndings } = countEndings(book.pages);

    res.json({
      success: true,
      data: {
        id: bookId,
        title: book.metadata.title,
        description: book.metadata.description,
        author: book.metadata.author,
        coAuthors: book.metadata.co_authors,
        coverImageUrl: book.metadata.cover_image_url,
        createdAt: book.metadata.creation_date,
        category: book.metadata.category,
        isIntroduction: bookId === booksData.introduction_book,
        pageCount: book.pages.length,
        goodEndings,
        badEndings,
        pages: book.pages.map((page, idx) => ({
          id: idx,
          story: page.story,
          type: page.type,
          options: page.options.map(opt => ({
            toPage: opt.toPage,
            type: opt.type,
            name: opt.name,
          })),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new book
 */
export async function adminCreateBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { metadata, pages } = req.body as { metadata: BookMetadata; pages?: BookPage[] };

    if (!metadata || !metadata.title || !metadata.author) {
      res.status(400).json({ success: false, message: 'Metadata with title and author is required' });
      return;
    }

    const booksData = readBooksData();
    const newBook: Book = {
      metadata: {
        title: metadata.title,
        description: metadata.description || '',
        author: metadata.author,
        co_authors: metadata.co_authors || [],
        cover_image_url: metadata.cover_image_url || '',
        creation_date: metadata.creation_date || new Date().toLocaleDateString('nl-NL'),
        category: metadata.category || 'fiction',
      },
      pages: pages || [
        {
          story: 'Your story begins here...',
          type: 'page',
          options: [],
        },
      ],
    };

    booksData.books.push(newBook);
    writeBooksData(booksData);

    const newBookId = booksData.books.length - 1;
    const { goodEndings, badEndings } = countEndings(newBook.pages);
    
    res.status(201).json({
      success: true,
      message: 'Book created',
      data: {
        id: newBookId,
        title: newBook.metadata.title,
        description: newBook.metadata.description,
        author: newBook.metadata.author,
        coAuthors: newBook.metadata.co_authors,
        coverImageUrl: newBook.metadata.cover_image_url,
        createdAt: newBook.metadata.creation_date,
        category: newBook.metadata.category,
        pageCount: newBook.pages.length,
        goodEndings,
        badEndings,
        isIntroduction: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update book metadata
 */
export async function adminUpdateBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    // Support both flat structure and nested metadata structure
    const body = req.body;
    const updates = body.metadata || body;

    if (updates.title) booksData.books[bookId].metadata.title = updates.title;
    if (updates.description !== undefined) booksData.books[bookId].metadata.description = updates.description;
    if (updates.author) booksData.books[bookId].metadata.author = updates.author;
    if (updates.co_authors || updates.coAuthors) booksData.books[bookId].metadata.co_authors = updates.co_authors || updates.coAuthors;
    if (updates.cover_image_url || updates.coverImageUrl) booksData.books[bookId].metadata.cover_image_url = updates.cover_image_url || updates.coverImageUrl;
    if (updates.creation_date || updates.createdAt) booksData.books[bookId].metadata.creation_date = updates.creation_date || updates.createdAt;
    if (updates.category) booksData.books[bookId].metadata.category = updates.category;

    writeBooksData(booksData);

    const book = booksData.books[bookId];
    const { goodEndings, badEndings } = countEndings(book.pages);

    res.json({
      success: true,
      message: 'Book updated',
      data: {
        id: bookId,
        title: book.metadata.title,
        description: book.metadata.description,
        author: book.metadata.author,
        coAuthors: book.metadata.co_authors,
        coverImageUrl: book.metadata.cover_image_url,
        createdAt: book.metadata.creation_date,
        category: book.metadata.category,
        pageCount: book.pages.length,
        goodEndings,
        badEndings,
        isIntroduction: bookId === booksData.introduction_book,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a book
 */
export async function adminDeleteBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    // Don't allow deleting the introduction book
    if (bookId === booksData.introduction_book) {
      res.status(400).json({ success: false, message: 'Cannot delete the introduction book' });
      return;
    }

    // Remove the book
    booksData.books.splice(bookId, 1);

    // Adjust introduction_book index if needed
    if (booksData.introduction_book > bookId) {
      booksData.introduction_book--;
    }

    writeBooksData(booksData);

    res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * Set the introduction book
 */
export async function adminSetIntroductionBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookId } = req.body as { bookId: number };
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(400).json({ success: false, message: 'Invalid book ID' });
      return;
    }

    booksData.introduction_book = bookId;
    writeBooksData(booksData);

    res.json({ success: true, message: 'Introduction book updated', introductionBook: bookId });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a page to a book
 */
export async function adminAddPage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    const { story, type, options } = req.body as BookPage;

    const newPage: BookPage = {
      story: story || '',
      type: type || 'page',
      options: options || [],
    };

    booksData.books[bookId].pages.push(newPage);
    writeBooksData(booksData);

    const newPageId = booksData.books[bookId].pages.length - 1;
    res.status(201).json({
      success: true,
      message: 'Page added',
      data: {
        bookId,
        pageId: newPageId,
        page: newPage,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update a page
 */
export async function adminUpdatePage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const pageId = parseInt(req.params.pageId, 10);
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    if (!Number.isFinite(pageId) || pageId < 0 || pageId >= booksData.books[bookId].pages.length) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }

    const { story, type, options } = req.body as Partial<BookPage>;

    if (story !== undefined) {
      booksData.books[bookId].pages[pageId].story = story;
    }
    if (type !== undefined) {
      booksData.books[bookId].pages[pageId].type = type;
    }
    if (options !== undefined) {
      booksData.books[bookId].pages[pageId].options = options;
    }

    writeBooksData(booksData);

    res.json({
      success: true,
      message: 'Page updated',
      data: {
        bookId,
        pageId,
        page: booksData.books[bookId].pages[pageId],
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a page
 */
export async function adminDeletePage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const pageId = parseInt(req.params.pageId, 10);
    const booksData = readBooksData();

    if (!Number.isFinite(bookId) || bookId < 0 || bookId >= booksData.books.length) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    if (!Number.isFinite(pageId) || pageId < 0 || pageId >= booksData.books[bookId].pages.length) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }

    // Don't allow deleting the last page
    if (booksData.books[bookId].pages.length === 1) {
      res.status(400).json({ success: false, message: 'Cannot delete the last page of a book' });
      return;
    }

    booksData.books[bookId].pages.splice(pageId, 1);

    // Update page references in options
    booksData.books[bookId].pages.forEach((page) => {
      page.options = page.options.map((opt) => {
        if (opt.toPage > pageId) {
          return { ...opt, toPage: opt.toPage - 1 };
        } else if (opt.toPage === pageId) {
          return { ...opt, toPage: 0 }; // Reset to first page if deleted page was referenced
        }
        return opt;
      });
    });

    writeBooksData(booksData);

    res.json({ success: true, message: 'Page deleted' });
  } catch (err) {
    next(err);
  }
}
