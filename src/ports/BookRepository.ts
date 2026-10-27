import type { Book } from '../domain/book';

/**
 * Хранилище библиотеки. Сейчас реализовано поверх IndexedDB;
 * для синхронизации можно добавить реализацию поверх HTTP API.
 */
export interface BookRepository {
  listBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  saveBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;
  /** Полностью заменяет содержимое хранилища. */
  replaceAll(books: Book[]): Promise<void>;
}
