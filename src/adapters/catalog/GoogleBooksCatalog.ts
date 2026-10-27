import type { BookDraft } from '../../domain/book';
import type { BookCatalog } from '../../ports/BookCatalog';

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

export class GoogleBooksCatalog implements BookCatalog {
  readonly name = 'google-books';

  constructor(
    private readonly fetchFn: typeof fetch = (...a) => fetch(...a),
    /** Личный ключ снимает общую квоту; без него Google может отвечать 429. */
    private readonly apiKey?: string,
  ) {}

  async search(query: string, signal?: AbortSignal): Promise<BookDraft[]> {
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', '15');
    url.searchParams.set('printType', 'books');
    if (this.apiKey) url.searchParams.set('key', this.apiKey);
    const res = await this.fetchFn(url, { signal });
    if (!res.ok) throw new Error(`Google Books: HTTP ${res.status}`);
    const json = (await res.json()) as { items?: GoogleVolume[] };
    return (json.items ?? []).flatMap((v) => {
      const info = v.volumeInfo;
      if (!info?.title) return [];
      const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
      const draft: BookDraft = {
        source: this.name,
        externalId: v.id,
        title: info.title,
        authors: info.authors ?? [],
        ...(info.description ? { description: info.description } : {}),
        ...(cover ? { coverUrl: cover.replace(/^http:/, 'https:') } : {}),
      };
      return [draft];
    });
  }
}
