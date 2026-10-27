import type { BookDraft } from '../../domain/book';
import type { BookCatalog } from '../../ports/BookCatalog';

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_sentence?: string[];
}

export class OpenLibraryCatalog implements BookCatalog {
  readonly name = 'open-library';

  constructor(private readonly fetchFn: typeof fetch = (...a) => fetch(...a)) {}

  async search(query: string, signal?: AbortSignal): Promise<BookDraft[]> {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '15');
    url.searchParams.set('fields', 'key,title,author_name,cover_i,first_sentence');
    const res = await this.fetchFn(url, { signal });
    if (!res.ok) throw new Error(`Open Library: HTTP ${res.status}`);
    const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
    const drafts = (json.docs ?? []).flatMap((d) => {
      if (!d.title) return [];
      const draft: BookDraft = {
        source: this.name,
        externalId: d.key,
        title: d.title,
        authors: d.author_name ?? [],
        ...(d.first_sentence?.[0] ? { description: d.first_sentence[0] } : {}),
        ...(d.cover_i
          ? { coverUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` }
          : {}),
      };
      return [draft];
    });
    return drafts;
  }

  /** Поиск Open Library не отдаёт описание — его берём со страницы «work» по запросу. */
  async describe(draft: BookDraft, signal?: AbortSignal): Promise<string | undefined> {
    const res = await this.fetchFn(`https://openlibrary.org${draft.externalId}.json`, { signal });
    if (!res.ok) return undefined;
    const work = (await res.json()) as { description?: string | { value?: string } };
    return typeof work.description === 'string' ? work.description : work.description?.value;
  }
}
