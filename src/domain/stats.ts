import type { Book, Rating } from './book';
import { NO_GENRE } from './genres';
import { daysBetween } from './readingPeriod';

export type PeriodKind = 'month' | 'year';

/** Календарный период в локальной временной зоне; `month` — 0–11, для года не используется. */
export interface Period {
  kind: PeriodKind;
  year: number;
  month: number;
}

export interface GenreStat {
  genre: string;
  count: number;
  /** Средняя оценка среди оценённых книг жанра. */
  avgRating?: number;
}

export interface BookDays {
  book: Book;
  days: number;
}

export interface Stats {
  /** Книги периода, последние законченные — первыми. */
  books: Book[];
  count: number;
  prevCount: number;
  ratedCount: number;
  avgRating?: number;
  avgDays?: number;
  fastest?: BookDays;
  slowest?: BookDays;
  topAuthor?: { name: string; count: number };
  genres: GenreStat[];
  /** Год: число книг по месяцам (12 значений). */
  byMonth: number[];
  /** Месяц: книги, которые читались в каждый день месяца (от старта до завершения), ключ — число 1–31. */
  byDay: Map<number, Book[]>;
}

export function currentPeriod(kind: PeriodKind, now: number): Period {
  const d = new Date(now);
  return { kind, year: d.getFullYear(), month: d.getMonth() };
}

/** Начало (включительно) и конец (исключительно) периода в мс. */
export function periodRange(p: Period): { start: number; end: number } {
  return p.kind === 'year'
    ? { start: new Date(p.year, 0, 1).getTime(), end: new Date(p.year + 1, 0, 1).getTime() }
    : {
        start: new Date(p.year, p.month, 1).getTime(),
        end: new Date(p.year, p.month + 1, 1).getTime(),
      };
}

/** Сдвигает период на `delta` месяцев или лет. */
export function shiftPeriod(p: Period, delta: number): Period {
  if (p.kind === 'year') return { ...p, year: p.year + delta };
  const d = new Date(p.year, p.month + delta, 1);
  return { kind: 'month', year: d.getFullYear(), month: d.getMonth() };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Прочитанные книги: на полке «прочитано» и с известной датой завершения. */
function finishedBooks(books: readonly Book[]): (Book & { finishedAt: number })[] {
  return books.filter(
    (b): b is Book & { finishedAt: number } =>
      b.status === 'finished' && b.finishedAt !== undefined,
  );
}

/** Самая ранняя дата завершения — дальше в прошлое листать незачем. */
export function earliestFinish(books: readonly Book[]): number | undefined {
  const times = finishedBooks(books).map((b) => b.finishedAt);
  return times.length ? Math.min(...times) : undefined;
}

const average = (nums: number[]): number | undefined =>
  nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined;

function genreStats(books: Book[]): GenreStat[] {
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    // Книга с несколькими жанрами учитывается в каждом из них.
    const genres = b.genres?.length ? b.genres : [NO_GENRE];
    for (const g of genres) groups.set(g, [...(groups.get(g) ?? []), b]);
  }
  return [...groups.entries()]
    .map(([genre, items]): GenreStat => {
      const avgRating = average(items.flatMap((b) => (b.rating ? [b.rating as Rating] : [])));
      return { genre, count: items.length, ...(avgRating !== undefined ? { avgRating } : {}) };
    })
    .sort(
      (a, b) =>
        // «Без жанра» всегда в конце, остальные — по числу книг.
        Number(a.genre === NO_GENRE) - Number(b.genre === NO_GENRE) ||
        b.count - a.count ||
        a.genre.localeCompare(b.genre, 'ru'),
    );
}

function topAuthor(books: Book[]): Stats['topAuthor'] {
  const counts = new Map<string, number>();
  for (const b of books)
    for (const a of new Set(b.authors)) counts.set(a, (counts.get(a) ?? 0) + 1);
  let best: Stats['topAuthor'];
  for (const [name, count] of counts) {
    if (count >= 2 && (!best || count > best.count)) best = { name, count };
  }
  return best;
}

export function computeStats(all: readonly Book[], period: Period): Stats {
  const finished = finishedBooks(all);
  const within = (range: { start: number; end: number }) =>
    finished.filter((b) => b.finishedAt >= range.start && b.finishedAt < range.end);

  const books = within(periodRange(period)).sort((a, b) => b.finishedAt - a.finishedAt);
  const prevCount = within(periodRange(shiftPeriod(period, -1))).length;

  const ratings = books.flatMap((b) => (b.rating ? [b.rating] : []));
  const withDays: BookDays[] = books.flatMap((b) =>
    b.startedAt === undefined ? [] : [{ book: b, days: daysBetween(b.startedAt, b.finishedAt) }],
  );
  // Быстрая и долгая имеют смысл, только если есть из чего выбирать.
  const sorted = [...withDays].sort((a, b) => a.days - b.days);
  const hasRange = sorted.length >= 2 && sorted[0]!.days !== sorted[sorted.length - 1]!.days;

  const byMonth = Array.from({ length: 12 }, () => 0);
  const byDay = new Map<number, Book[]>();
  for (const b of books) {
    const d = new Date(b.finishedAt);
    byMonth[d.getMonth()]!++;
  }
  if (period.kind === 'month') {
    for (let day = 1; day <= daysInMonth(period.year, period.month); day++) {
      const dayStart = new Date(period.year, period.month, day).getTime();
      const dayEnd = new Date(period.year, period.month, day + 1).getTime();
      const reading = finished.filter((b) => {
        // Без даты старта (или с ошибочной) книга отмечается только в день завершения.
        const start =
          b.startedAt === undefined || b.startedAt > b.finishedAt ? b.finishedAt : b.startedAt;
        return start < dayEnd && b.finishedAt >= dayStart;
      });
      if (reading.length)
        byDay.set(
          day,
          reading.sort((a, b) => a.finishedAt - b.finishedAt),
        );
    }
  }

  const avgRating = average(ratings);
  const avgDays = average(withDays.map((x) => x.days));
  const author = topAuthor(books);
  return {
    books,
    count: books.length,
    prevCount,
    ratedCount: ratings.length,
    ...(avgRating !== undefined ? { avgRating } : {}),
    ...(avgDays !== undefined ? { avgDays } : {}),
    ...(hasRange ? { fastest: sorted[0]!, slowest: sorted[sorted.length - 1]! } : {}),
    ...(author ? { topAuthor: author } : {}),
    genres: genreStats(books),
    byMonth,
    byDay,
  };
}

/** «1 книга», «3 книги», «11 книг». */
export function formatBooks(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  const word =
    mod100 >= 11 && mod100 <= 14
      ? 'книг'
      : mod10 === 1
        ? 'книга'
        : mod10 >= 2 && mod10 <= 4
          ? 'книги'
          : 'книг';
  return `${n} ${word}`;
}
