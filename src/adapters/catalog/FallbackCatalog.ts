import type { BookDraft } from '../../domain/book';
import type { BookCatalog } from '../../ports/BookCatalog';

/** Пробует каталоги по порядку: переходит к следующему при ошибке или пустом результате. */
export class FallbackCatalog implements BookCatalog {
  readonly name = 'fallback';

  constructor(private readonly catalogs: readonly BookCatalog[]) {}

  async search(query: string, signal?: AbortSignal): Promise<BookDraft[]> {
    let lastError: unknown;
    let succeeded = false;
    for (const catalog of this.catalogs) {
      try {
        const results = await catalog.search(query, signal);
        succeeded = true;
        if (results.length > 0) return results;
      } catch (e) {
        if (signal?.aborted) throw e;
        lastError = e;
      }
    }
    if (!succeeded && lastError) throw lastError;
    return [];
  }

  describe(draft: BookDraft, signal?: AbortSignal): Promise<string | undefined> {
    const owner = this.catalogs.find((c) => c.name === draft.source);
    return owner?.describe?.(draft, signal) ?? Promise.resolve(undefined);
  }
}
