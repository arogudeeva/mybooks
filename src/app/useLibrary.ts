import { useCallback, useEffect, useState } from 'react';
import type { Book } from '../domain/book';
import { useContainer } from './ContainerContext';

/** Список книг библиотеки; `reload` вызывается после любого изменения. */
export function useLibrary() {
  const { books } = useContainer();
  const [list, setList] = useState<Book[] | null>(null);
  /** Момент последней загрузки — от него считаются «дни чтения», чтобы render оставался чистым. */
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setList(await books.list());
    setNow(Date.now());
  }, [books]);

  useEffect(() => {
    void books.list().then((items) => {
      setList(items);
      setNow(Date.now());
    });
  }, [books]);

  return { books: list, now, reload: load };
}
