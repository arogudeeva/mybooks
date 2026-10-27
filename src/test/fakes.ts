import type { BookDraft } from '../domain/book';
import type { Clock } from '../services/clock';

export function fakeClock(start = 1_000): Clock & { advance(ms: number): void } {
  let t = start;
  return { now: () => t, advance: (ms) => void (t += ms) };
}

export function sequentialIds(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}

export const draft = (over: Partial<BookDraft> = {}): BookDraft => ({
  source: 'test',
  externalId: 'x1',
  title: 'Мастер и Маргарита',
  authors: ['М. Булгаков'],
  ...over,
});
