import type { Book } from './book';

const DAY_MS = 86_400_000;

function dayNumber(ts: number): number {
  const d = new Date(ts);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** Количество календарных дней от start до end, оба дня включительно (в тот же день — 1). */
export function daysBetween(start: number, end: number): number {
  return Math.max(1, dayNumber(end) - dayNumber(start) + 1);
}

/** Сколько дней книга читается (или читалась); undefined, если дата старта неизвестна. */
export function readingDays(book: Book, now: number): number | undefined {
  if (book.status === 'want' || book.startedAt === undefined) return undefined;
  return daysBetween(book.startedAt, book.status === 'finished' ? (book.finishedAt ?? now) : now);
}

/** «1 день», «3 дня», «11 дней». */
export function formatDays(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  const word =
    mod100 >= 11 && mod100 <= 14
      ? 'дней'
      : mod10 === 1
        ? 'день'
        : mod10 >= 2 && mod10 <= 4
          ? 'дня'
          : 'дней';
  return `${n} ${word}`;
}

/** Значение для <input type="date"> в локальной временной зоне. */
export function toDateInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Обратное преобразование; время ставится на полдень, чтобы не зависеть от смены часового пояса. */
export function fromDateInput(value: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).getTime();
}
