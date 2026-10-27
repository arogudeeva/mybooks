import {
  createBook,
  moveToShelf,
  type Book,
  type BookDraft,
  type Rating,
  type ShelfStatus,
} from '../domain/book';
import type { BookRepository } from '../ports/BookRepository';
import { systemClock, uuid, type Clock, type IdGenerator } from './clock';

export class BookService {
  constructor(
    private readonly repo: BookRepository,
    private readonly clock: Clock = systemClock,
    private readonly newId: IdGenerator = uuid,
  ) {}

  list(): Promise<Book[]> {
    return this.repo.listBooks();
  }

  get(id: string): Promise<Book | undefined> {
    return this.repo.getBook(id);
  }

  /** Добавляет книгу из каталога. Если она уже в библиотеке — переносит на выбранную полку. */
  async add(draft: BookDraft, status: ShelfStatus): Promise<Book> {
    const existing = (await this.repo.listBooks()).find(
      (b) => b.source === draft.source && b.externalId === draft.externalId,
    );
    if (existing) return this.moveTo(existing.id, status);
    const book = createBook(draft, status, this.newId(), this.clock.now());
    await this.repo.saveBook(book);
    return book;
  }

  moveTo(id: string, status: ShelfStatus): Promise<Book> {
    return this.update(id, (b) => moveToShelf(b, status, this.clock.now()));
  }

  setRating(id: string, rating: Rating | undefined): Promise<Book> {
    return this.update(id, (b) => {
      const next = { ...b, updatedAt: this.clock.now() };
      if (rating === undefined) delete next.rating;
      else next.rating = rating;
      return next;
    });
  }

  /** Ручная правка дат чтения. `undefined` убирает дату. */
  setDates(id: string, dates: { startedAt?: number | undefined; finishedAt?: number | undefined }) {
    return this.update(id, (b) => {
      const next = { ...b, updatedAt: this.clock.now() };
      if ('startedAt' in dates) {
        if (dates.startedAt === undefined) delete next.startedAt;
        else next.startedAt = dates.startedAt;
      }
      if ('finishedAt' in dates) {
        if (dates.finishedAt === undefined) delete next.finishedAt;
        else next.finishedAt = dates.finishedAt;
      }
      return next;
    });
  }

  setNotes(id: string, notes: string): Promise<Book> {
    return this.update(id, (b) => ({ ...b, notes, updatedAt: this.clock.now() }));
  }

  remove(id: string): Promise<void> {
    return this.repo.deleteBook(id);
  }

  private async update(id: string, change: (book: Book) => Book): Promise<Book> {
    const book = await this.repo.getBook(id);
    if (!book) throw new Error(`Книга не найдена: ${id}`);
    const next = change(book);
    if (next !== book) await this.repo.saveBook(next);
    return next;
  }
}
