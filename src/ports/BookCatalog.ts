import type { BookDraft } from '../domain/book';

/** Внешний источник данных о книгах (Google Books, Open Library, ...). */
export interface BookCatalog {
  readonly name: string;
  search(query: string, signal?: AbortSignal): Promise<BookDraft[]>;
  /** Догружает описание, если поиск его не вернул (необязательно). */
  describe?(draft: BookDraft, signal?: AbortSignal): Promise<string | undefined>;
}
