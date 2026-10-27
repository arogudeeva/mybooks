import { useEffect, useState } from 'react';
import type { BookDraft } from '../../domain/book';
import type { BookCatalog } from '../../ports/BookCatalog';

const MIN_QUERY_LENGTH = 2;

export type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; results: BookDraft[] }
  | { kind: 'error' };

export function useDebouncedSearch(
  catalog: BookCatalog,
  query: string,
  delayMs = 400,
): SearchState {
  const [state, setState] = useState<SearchState>({ kind: 'idle' });

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ kind: 'loading' });
      catalog
        .search(q, controller.signal)
        .then((results) => setState({ kind: 'done', results }))
        .catch(() => {
          if (!controller.signal.aborted) setState({ kind: 'error' });
        });
    }, delayMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [catalog, query, delayMs]);

  // Короткий запрос всегда показывается как «ничего не искали», даже если осталось старое состояние.
  return query.trim().length < MIN_QUERY_LENGTH ? { kind: 'idle' } : state;
}
