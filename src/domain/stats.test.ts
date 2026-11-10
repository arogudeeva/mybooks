import type { Book } from './book';
import { collectGenres, genresFromCategories, knownGenres, normalizeGenres } from './genres';
import { computeStats, currentPeriod, formatBooks, shiftPeriod, type Period } from './stats';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

let n = 0;
const book = (over: Partial<Book> = {}): Book => ({
  id: `b${++n}`,
  source: 't',
  externalId: `e${n}`,
  title: `Книга ${n}`,
  authors: ['А'],
  status: 'finished',
  notes: '',
  addedAt: 0,
  updatedAt: 0,
  ...over,
});

const NOW = at(2026, 12, 31);
const month = (year: number, m: number): Period => ({ kind: 'month', year, month: m - 1 });
const year = (y: number): Period => ({ kind: 'year', year: y, month: 0 });

describe('genres', () => {
  it('разбирает категории Google и отбрасывает общие', () => {
    expect(genresFromCategories(['Fiction / Science Fiction / General'])).toEqual(['Фантастика']);
  });

  it('убирает дубли без учёта регистра и ограничивает число', () => {
    expect(normalizeGenres(['детектив', 'Детектив', ' ', 'А', 'Б', 'В'])).toEqual([
      'Детектив',
      'А',
      'Б',
    ]);
  });

  it('из шумных subject берёт только известные жанры', () => {
    expect(knownGenres(['Fantasy', 'Dragons', 'Accessible book'])).toEqual(['Фэнтези']);
  });

  it('собирает жанры библиотеки по частоте', () => {
    const books = [book({ genres: ['Б', 'А'] }), book({ genres: ['Б'] }), book()];
    expect(collectGenres(books)).toEqual(['Б', 'А']);
  });
});

describe('stats', () => {
  it('считает по дате завершения, а не старта, в локальных границах месяца', () => {
    const books = [
      book({ startedAt: at(2025, 12, 20), finishedAt: at(2026, 1, 2) }),
      book({ finishedAt: new Date(2026, 0, 31, 23, 59).getTime() }),
      book({ finishedAt: new Date(2026, 1, 1, 0, 0).getTime() }),
    ];
    expect(computeStats(books, month(2026, 1), NOW).count).toBe(2);
    expect(computeStats(books, month(2026, 2), NOW).count).toBe(1);
    expect(computeStats(books, year(2026), NOW).byMonth.slice(0, 2)).toEqual([2, 1]);
  });

  it('игнорирует книги не на полке «прочитано» и без даты завершения', () => {
    const books = [
      book({ status: 'reading', finishedAt: at(2026, 3, 1) }),
      book({ finishedAt: undefined }),
      book({ status: 'want' }),
    ];
    expect(computeStats(books, year(2026), NOW).count).toBe(0);
  });

  it('сравнивает с прошлым периодом, в том числе через границу года', () => {
    const books = [book({ finishedAt: at(2025, 12, 5) }), book({ finishedAt: at(2026, 1, 5) })];
    const s = computeStats(books, month(2026, 1), NOW);
    expect(s.prevCount).toBe(1);
    expect(shiftPeriod(month(2026, 1), -1)).toEqual(month(2025, 12));
  });

  it('средняя оценка — только по оценённым, дни — только по книгам с датой старта', () => {
    const books = [
      book({ rating: 5, startedAt: at(2026, 3, 1), finishedAt: at(2026, 3, 3) }),
      book({ rating: 3, startedAt: at(2026, 3, 1), finishedAt: at(2026, 3, 10) }),
      book({ finishedAt: at(2026, 3, 15) }),
    ];
    const s = computeStats(books, month(2026, 3), NOW);
    expect(s.avgRating).toBe(4);
    expect(s.ratedCount).toBe(2);
    expect(s.avgDays).toBe(6.5);
    expect(s.fastest?.days).toBe(3);
    expect(s.slowest?.days).toBe(10);
  });

  it('жанры: книга учитывается в каждом своём жанре, без жанра — в конце', () => {
    const books = [
      book({ genres: ['Фантастика', 'Классика'], rating: 5, finishedAt: at(2026, 3, 1) }),
      book({ genres: ['Фантастика'], rating: 3, finishedAt: at(2026, 3, 2) }),
      book({ finishedAt: at(2026, 3, 3) }),
      book({ genres: ['Классика'], finishedAt: at(2026, 3, 4) }),
    ];
    const g = computeStats(books, month(2026, 3), NOW).genres;
    expect(g.map((x) => [x.genre, x.count, x.avgRating])).toEqual([
      ['Классика', 2, 5],
      ['Фантастика', 2, 4],
      ['Без жанра', 1, undefined],
    ]);
  });

  it('находит автора с 2+ книгами', () => {
    const books = [
      book({ authors: ['Х'], finishedAt: at(2026, 3, 7) }),
      book({ authors: ['Х', 'У'], finishedAt: at(2026, 3, 7) }),
    ];
    expect(computeStats(books, month(2026, 3), NOW).topAuthor).toEqual({ name: 'Х', count: 2 });
  });

  it('отмечает в календаре все дни чтения от старта до завершения, в том числе с прошлого месяца', () => {
    const a = book({ startedAt: at(2026, 2, 27), finishedAt: at(2026, 3, 2) });
    const b = book({ startedAt: at(2026, 3, 2), finishedAt: at(2026, 3, 4) });
    const noStart = book({ finishedAt: at(2026, 3, 10) });
    const later = book({ startedAt: at(2026, 3, 30), finishedAt: at(2026, 4, 3) });
    const { byDay } = computeStats([a, b, noStart, later], month(2026, 3), NOW);
    expect([1, 2, 3, 4, 5, 10, 30, 31].map((d) => byDay.get(d)?.length ?? 0)).toEqual([
      1, 2, 1, 1, 0, 1, 1, 1,
    ]);
    expect(computeStats([a], year(2026), NOW).byDay.size).toBe(0);
  });

  it('читаемая сейчас книга отмечается от старта до сегодняшнего дня и входит в книги периода', () => {
    const reading = book({ status: 'reading', startedAt: at(2026, 3, 5) });
    const want = book({ status: 'want', startedAt: at(2026, 3, 5) });
    const now = at(2026, 3, 8);
    const s = computeStats([reading, want], month(2026, 3), now);
    expect([4, 5, 8, 9].map((d) => s.byDay.get(d)?.length ?? 0)).toEqual([0, 1, 1, 0]);
    expect(s.periodBooks).toEqual([reading]);
    expect(s.count).toBe(0);
  });

  it('книги периода включают начатые раньше и законченные позже, но счётчик — по дате окончания', () => {
    const early = book({ startedAt: at(2026, 2, 20), finishedAt: at(2026, 3, 3) });
    const late = book({ startedAt: at(2026, 3, 28), finishedAt: at(2026, 4, 2) });
    const out = book({ startedAt: at(2026, 1, 1), finishedAt: at(2026, 1, 5) });
    const s = computeStats([early, late, out], month(2026, 3), NOW);
    expect(s.periodBooks.map((x) => x.id)).toEqual([late.id, early.id]);
    expect(s.count).toBe(1);
  });

  it('пустой период и склонение', () => {
    const s = computeStats([], currentPeriod('year', at(2026, 5, 1)), NOW);
    expect(s).toMatchObject({ count: 0, genres: [] });
    expect([1, 3, 11, 21].map(formatBooks)).toEqual(['1 книга', '3 книги', '11 книг', '21 книга']);
  });
});
