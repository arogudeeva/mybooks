import { useCallback, useEffect, useState } from 'react';
import { useContainer } from '../../app/ContainerContext';
import { SHELVES, type Book, type ShelfStatus } from '../../domain/book';
import { Cover } from '../../ui/Cover';
import { StarRating } from '../../ui/StarRating';
import { strings } from '../../ui/strings';
import { NotesField } from './NotesField';
import { ReadingPeriod } from './ReadingPeriod';

interface Props {
  bookId: string;
  now: number;
  onClose: () => void;
  /** Вызывается после изменения, чтобы обновить списки на полках. */
  onChanged: () => void;
}

export function BookDetails({ bookId, now, onClose, onChanged }: Props) {
  const { books } = useContainer();
  const [book, setBook] = useState<Book | undefined>();

  useEffect(() => {
    void books.get(bookId).then(setBook);
  }, [books, bookId]);

  const apply = useCallback(
    async (change: Promise<Book>) => {
      setBook(await change);
      onChanged();
    },
    [onChanged],
  );

  const saveNotes = useCallback(
    (notes: string) => void books.setNotes(bookId, notes).then(onChanged),
    [books, bookId, onChanged],
  );

  if (!book) return null;

  async function remove() {
    if (!window.confirm(strings.details.confirmDelete)) return;
    await books.remove(bookId);
    onChanged();
    onClose();
  }

  return (
    <div className="details">
      <button className="link back" onClick={onClose}>
        ← {strings.details.back}
      </button>
      <div className="details-head">
        <Cover url={book.coverUrl} title={book.title} size="lg" />
        <div>
          <h1>{book.title}</h1>
          <p className="muted">{book.authors.join(', ') || strings.details.unknownAuthor}</p>
        </div>
      </div>

      <div className="actions">
        <span className="muted">{strings.details.moveTo}</span>
        {SHELVES.filter((s) => s !== book.status).map((s: ShelfStatus) => (
          <button key={s} className="btn" onClick={() => void apply(books.moveTo(book.id, s))}>
            {strings.shelf[s]}
          </button>
        ))}
      </div>

      {book.status === 'finished' && (
        <>
          <h3>{strings.details.rating}</h3>
          <StarRating
            value={book.rating}
            onChange={(r) => void apply(books.setRating(book.id, r))}
          />
          <NotesField value={book.notes} onSave={saveNotes} />
        </>
      )}

      {book.status !== 'want' && (
        <ReadingPeriod
          book={book}
          now={now}
          onChange={(dates) => void apply(books.setDates(book.id, dates))}
        />
      )}

      <p className="description">{book.description ?? strings.details.noDescription}</p>

      <button className="btn btn-danger" onClick={() => void remove()}>
        {strings.details.delete}
      </button>
    </div>
  );
}
