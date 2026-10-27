import { fromDateInput, readingDays, formatDays, toDateInput } from '../../domain/readingPeriod';
import type { Book } from '../../domain/book';
import { strings } from '../../ui/strings';

interface Props {
  book: Book;
  now: number;
  onChange: (dates: { startedAt?: number | undefined; finishedAt?: number | undefined }) => void;
}

/** Даты начала/окончания чтения и итоговое количество дней. Даты можно поправить вручную. */
export function ReadingPeriod({ book, now, onChange }: Props) {
  const days = readingDays(book, now);
  const finished = book.status === 'finished';

  return (
    <section className="period">
      {days !== undefined && (
        <p className="period-total">
          {finished ? strings.period.readIn : strings.period.readingFor}{' '}
          <strong>{formatDays(days)}</strong>
        </p>
      )}
      <div className="period-dates">
        <label className="field">
          <span>{strings.period.startedAt}</span>
          <input
            type="date"
            className="input"
            value={book.startedAt === undefined ? '' : toDateInput(book.startedAt)}
            onChange={(e) => onChange({ startedAt: fromDateInput(e.target.value) })}
          />
        </label>
        {finished && (
          <label className="field">
            <span>{strings.period.finishedAt}</span>
            <input
              type="date"
              className="input"
              value={book.finishedAt === undefined ? '' : toDateInput(book.finishedAt)}
              onChange={(e) => onChange({ finishedAt: fromDateInput(e.target.value) })}
            />
          </label>
        )}
      </div>
    </section>
  );
}
