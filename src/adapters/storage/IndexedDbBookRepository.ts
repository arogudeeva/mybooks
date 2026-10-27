import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Book } from '../../domain/book';
import type { BookRepository } from '../../ports/BookRepository';

interface LibraryDB extends DBSchema {
  books: { key: string; value: Book };
}

const DB_VERSION = 2;

export class IndexedDbBookRepository implements BookRepository {
  private readonly db: Promise<IDBPDatabase<LibraryDB>>;

  constructor(name = 'my-books') {
    this.db = openDB<LibraryDB>(name, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Новые версии схемы добавляются сюда как `if (oldVersion < N) { ... }`.
        if (oldVersion < 1) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (oldVersion >= 1 && oldVersion < 2) {
          // v2: таймер сессий заменён датами начала/окончания чтения в самой книге.
          (db as unknown as IDBPDatabase).deleteObjectStore('sessions');
        }
      },
    });
  }

  async listBooks() {
    return (await this.db).getAll('books');
  }

  async getBook(id: string) {
    return (await this.db).get('books', id);
  }

  async saveBook(book: Book) {
    await (await this.db).put('books', book);
  }

  async deleteBook(id: string) {
    await (await this.db).delete('books', id);
  }

  async replaceAll(books: Book[]) {
    const tx = (await this.db).transaction('books', 'readwrite');
    await tx.store.clear();
    await Promise.all(books.map((b) => tx.store.put(b)));
    await tx.done;
  }
}
