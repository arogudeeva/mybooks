import type { Book, ShelfStatus } from '../../domain/book';
import { formatDays, readingDays } from '../../domain/readingPeriod';
import { Cover } from '../../ui/Cover';
import { strings } from '../../ui/strings';

interface Props {
  status: ShelfStatus;
  books: Book[];
  now: number;
  onOpen: (id: string) => void;
}

export function ShelfView({ status, books, now, onOpen }: Props) {
  const items = books.filter((b) => b.status === status).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <section>
      <h1>{strings.shelf[status]}</h1>
      {items.length === 0 ? (
        <p className="muted">{strings.shelfEmpty[status]}</p>
      ) : (
        <ul className="book-list">
          {items.map((b) => (
            <li key={b.id}>
              <button className="book-card" onClick={() => onOpen(b.id)}>
                <Cover url={b.coverUrl} title={b.title} />
                <span className="book-card-text">
                  <strong>{b.title}</strong>
                  <span className="muted">
                    {b.authors.join(', ') || strings.details.unknownAuthor}
                  </span>
                  {readingDays(b, now) !== undefined && (
                    <span className="muted">
                      {b.status === 'finished' ? strings.period.readIn : strings.period.readingFor}{' '}
                      {formatDays(readingDays(b, now)!)}
                    </span>
                  )}
                  {b.status === 'finished' && b.rating && (
                    <span className="star on" aria-label={`Оценка ${b.rating} из 5`}>
                      {'★'.repeat(b.rating)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
