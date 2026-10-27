export type ShelfStatus = 'want' | 'reading' | 'finished';

export const SHELVES: readonly ShelfStatus[] = ['reading', 'finished', 'want'];

export type Rating = 1 | 2 | 3 | 4 | 5;

/** Данные о книге из внешнего каталога, ещё не добавленной в библиотеку. */
export interface BookDraft {
  source: string;
  externalId: string;
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
}

export interface Book extends BookDraft {
  id: string;
  status: ShelfStatus;
  rating?: Rating;
  notes: string;
  addedAt: number;
  startedAt?: number;
  finishedAt?: number;
  updatedAt: number;
}

export function createBook(draft: BookDraft, status: ShelfStatus, id: string, now: number): Book {
  return {
    ...draft,
    id,
    status,
    notes: '',
    addedAt: now,
    updatedAt: now,
    ...(status === 'reading' ? { startedAt: now } : {}),
    ...(status === 'finished' ? { finishedAt: now } : {}),
  };
}

/** Возвращает копию книги, перенесённую на другую полку, с обновлёнными датами. */
export function moveToShelf(book: Book, status: ShelfStatus, now: number): Book {
  if (book.status === status) return book;
  const next: Book = { ...book, status, updatedAt: now };
  if (status === 'reading') {
    next.startedAt = book.startedAt ?? now;
    delete next.finishedAt;
  } else if (status === 'finished') {
    next.finishedAt = now;
  } else {
    delete next.finishedAt;
  }
  return next;
}
