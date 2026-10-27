import { openDB } from 'idb';
import type { BookRepository } from '../../ports/BookRepository';
import { createBook } from '../../domain/book';
import { draft } from '../../test/fakes';
import { IndexedDbBookRepository } from './IndexedDbBookRepository';

/** Контракт для любой реализации BookRepository (в т.ч. будущей удалённой). */
export function describeBookRepository(name: string, make: () => BookRepository) {
  describe(`BookRepository: ${name}`, () => {
    let repo: BookRepository;
    beforeEach(() => {
      repo = make();
    });
    it('сохраняет и читает книги', async () => {
      const book = createBook(draft(), 'want', 'b1', 1);
      await repo.saveBook(book);
      expect(await repo.getBook('b1')).toEqual(book);
      expect(await repo.listBooks()).toHaveLength(1);
    });

    it('удаляет книгу', async () => {
      await repo.saveBook(createBook(draft(), 'reading', 'a', 1));
      await repo.deleteBook('a');
      expect(await repo.getBook('a')).toBeUndefined();
    });

    it('replaceAll полностью заменяет данные', async () => {
      await repo.saveBook(createBook(draft(), 'want', 'old', 1));
      await repo.replaceAll([createBook(draft(), 'want', 'new', 1)]);
      expect((await repo.listBooks()).map((b) => b.id)).toEqual(['new']);
    });
  });
}

let n = 0;
describeBookRepository('IndexedDB', () => new IndexedDbBookRepository(`test-db-${++n}`));

describe('IndexedDB: миграция схемы', () => {
  it('v1 → v2: сохраняет книги и удаляет хранилище сессий', async () => {
    const name = 'migration-db';
    const old = await openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore('books', { keyPath: 'id' });
        db.createObjectStore('sessions', { keyPath: 'id' });
      },
    });
    await old.put('books', createBook(draft(), 'reading', 'keep', 1));
    old.close();

    const repo = new IndexedDbBookRepository(name);
    expect((await repo.listBooks()).map((b) => b.id)).toEqual(['keep']);
    const upgraded = await openDB(name);
    expect([...upgraded.objectStoreNames]).toEqual(['books']);
    upgraded.close();
  });
});
