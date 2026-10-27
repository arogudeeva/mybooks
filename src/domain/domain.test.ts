import { createBook, moveToShelf } from './book';
import { daysBetween, formatDays, fromDateInput, readingDays, toDateInput } from './readingPeriod';
import { parseBackup } from './backup';
import { draft } from '../test/fakes';

describe('book', () => {
  it('ставит startedAt при создании на полке «читаю»', () => {
    expect(createBook(draft(), 'reading', 'b', 5).startedAt).toBe(5);
  });

  it('при переносе в «прочитано» ставит finishedAt, при возврате — убирает', () => {
    const reading = createBook(draft(), 'reading', 'b', 1);
    const done = moveToShelf(reading, 'finished', 9);
    expect(done.finishedAt).toBe(9);
    expect(done.startedAt).toBe(1);
    expect(moveToShelf(done, 'reading', 12).finishedAt).toBeUndefined();
  });

  it('возвращает ту же книгу, если полка не изменилась', () => {
    const b = createBook(draft(), 'want', 'b', 1);
    expect(moveToShelf(b, 'want', 2)).toBe(b);
  });
});

describe('reading period', () => {
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

  it('считает календарные дни включительно', () => {
    expect(daysBetween(at(2026, 10, 1, 23), at(2026, 10, 1, 1))).toBe(1);
    expect(daysBetween(at(2026, 10, 1), at(2026, 10, 4))).toBe(4);
    expect(daysBetween(at(2026, 10, 30), at(2026, 11, 2))).toBe(4);
  });

  it('для «читаю» считает до текущего момента, для «прочитано» — до даты окончания', () => {
    const reading = { ...createBook(draft(), 'reading', 'b', at(2026, 10, 1)) };
    expect(readingDays(reading, at(2026, 10, 6))).toBe(6);
    const done = moveToShelf(reading, 'finished', at(2026, 10, 3));
    expect(readingDays(done, at(2026, 12, 1))).toBe(3);
  });

  it('не считает дни для «хочу прочитать» и книг без даты старта', () => {
    expect(readingDays(createBook(draft(), 'want', 'b', 1), 5)).toBeUndefined();
    const noStart = createBook(draft(), 'finished', 'b', 1);
    expect(readingDays(noStart, 5)).toBeUndefined();
  });

  it('склоняет «день»', () => {
    expect([1, 2, 5, 11, 21, 22, 112].map(formatDays)).toEqual([
      '1 день',
      '2 дня',
      '5 дней',
      '11 дней',
      '21 день',
      '22 дня',
      '112 дней',
    ]);
  });

  it('преобразует даты для поля ввода туда и обратно', () => {
    expect(toDateInput(fromDateInput('2026-03-09')!)).toBe('2026-03-09');
    expect(fromDateInput('')).toBeUndefined();
  });
});

describe('parseBackup', () => {
  it('отклоняет не-JSON и чужие файлы', () => {
    expect(() => parseBackup('нет')).toThrow();
    expect(() => parseBackup('{"a":1}')).toThrow();
    expect(() => parseBackup('{"version":99,"books":[]}')).toThrow(/версия/);
  });

  it('принимает копии старой версии 1 (сессии игнорируются)', () => {
    expect(parseBackup('{"version":1,"books":[],"sessions":[]}').books).toEqual([]);
  });

  it('принимает корректную копию', () => {
    expect(parseBackup('{"version":2,"exportedAt":0,"books":[]}').books).toEqual([]);
  });
});
