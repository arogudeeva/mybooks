import { IndexedDbBookRepository } from '../adapters/storage/IndexedDbBookRepository';
import { draft, fakeClock, sequentialIds } from '../test/fakes';
import { BackupService } from './BackupService';
import { BookService } from './BookService';

let n = 0;
function setup() {
  const repo = new IndexedDbBookRepository(`svc-db-${++n}`);
  const clock = fakeClock();
  const ids = sequentialIds();
  return {
    repo,
    clock,
    books: new BookService(repo, clock, ids),
    backup: new BackupService(repo, clock),
  };
}

describe('BookService', () => {
  it('не дублирует книгу, а переносит её на новую полку', async () => {
    const { books } = setup();
    await books.add(draft(), 'want');
    const again = await books.add(draft(), 'reading');
    expect(await books.list()).toHaveLength(1);
    expect(again.status).toBe('reading');
  });

  it('сохраняет оценку и заметки', async () => {
    const { books } = setup();
    const b = await books.add(draft(), 'finished');
    await books.setRating(b.id, 5);
    await books.setNotes(b.id, 'Великая книга');
    expect(await books.get(b.id)).toMatchObject({ rating: 5, notes: 'Великая книга' });
    await books.setRating(b.id, undefined);
    expect((await books.get(b.id))?.rating).toBeUndefined();
  });

  it('бросает ошибку для несуществующей книги', async () => {
    await expect(setup().books.setNotes('нет', 'x')).rejects.toThrow();
  });
});

describe('даты чтения', () => {
  it('фиксирует старт при переносе в «читаю» и окончание — в «прочитано»', async () => {
    const { books, clock } = setup();
    const b = await books.add(draft(), 'want');
    clock.advance(1000);
    const reading = await books.moveTo(b.id, 'reading');
    expect(reading.startedAt).toBe(clock.now());
    clock.advance(5000);
    const done = await books.moveTo(b.id, 'finished');
    expect(done).toMatchObject({ startedAt: reading.startedAt, finishedAt: clock.now() });
  });

  it('позволяет поправить и убрать даты вручную', async () => {
    const { books } = setup();
    const b = await books.add(draft(), 'finished');
    expect(await books.setDates(b.id, { startedAt: 10, finishedAt: 20 })).toMatchObject({
      startedAt: 10,
      finishedAt: 20,
    });
    const cleared = await books.setDates(b.id, { startedAt: undefined });
    expect(cleared.startedAt).toBeUndefined();
    expect(cleared.finishedAt).toBe(20);
  });
});

describe('BackupService', () => {
  it('экспорт → импорт восстанавливает данные', async () => {
    const a = setup();
    await a.books.add(draft(), 'reading');
    const json = await a.backup.export();

    const other = setup();
    expect(await other.backup.import(json)).toEqual({ books: 1 });
    expect(await other.books.list()).toHaveLength(1);
  });
});
