import { expect, test, vi } from 'vitest';
import { getIntroductionBook } from './booksController.ts';

test('getIntroductionBook should respond with status 200 and introduction book data', async () => {
  const mockReq = {
    url: '/books/introduction',
  } as any;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as any;

  const mockNext = vi.fn();

  await getIntroductionBook(mockReq, mockRes, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      meta: expect.objectContaining({
        count: 1,
        title: 'introduction book index',
        url: '/books/introduction',
      }),
      data: expect.stringMatching(/^\/\d+$/),
    })
  );
});

// test('getIntroductionBook should handle errors with status 503', async () => {
//   const mockReq = {
//     url: '/books/introduction',
//   } as any;

//   const mockRes = {
//     status: vi.fn().mockReturnThis(),
//     json: vi.fn(),
//   } as any;

//   const mockNext = vi.fn();

//   // vi.mock('../assets/books/books.json', () => {
//   //   throw new Error('Failed to load books');
//   // });

//   await getIntroductionBook(mockReq, mockRes, mockNext);

//   expect(mockRes.status).toHaveBeenCalledWith(503);
//   expect(mockRes.json).toHaveBeenCalledWith(
//     expect.objectContaining({
//       meta: expect.objectContaining({
//         count: 1,
//         title: 'Could not get the introduction book index you requested',
//       }),
//     })
//   );
// });
