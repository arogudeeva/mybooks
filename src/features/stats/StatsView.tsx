import { useMemo, useState } from 'react';
import type { Book } from '../../domain/book';
import { NO_GENRE } from '../../domain/genres';
import { formatDays } from '../../domain/readingPeriod';
import {
  computeStats,
  currentPeriod,
  earliestReading,
  formatBooks,
  periodRange,
  shiftPeriod,
  type BookDays,
  type Period,
  type PeriodKind,
} from '../../domain/stats';
import { Cover } from '../../ui/Cover';
import { GenreChips } from '../../ui/GenreChips';
import { strings } from '../../ui/strings';
import { GenreBars } from './GenreBars';
import { MonthCalendar } from './MonthCalendar';
import { YearChart } from './YearChart';

interface Props {
  books: Book[];
  now: number;
  onOpen: (id: string) => void;
}

type Filter = { kind: 'genre'; genre: string } | { kind: 'day'; day: number } | null;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function periodTitle(p: Period): string {
  if (p.kind === 'year') return String(p.year);
  const month = new Intl.DateTimeFormat('ru', { month: 'long' }).format(new Date(p.year, p.month));
  return `${capitalize(month)} ${p.year}`;
}

function delta(count: number, prev: number, kind: PeriodKind): string | undefined {
  if (count === 0 && prev === 0) return undefined;
  const diff = count - prev;
  if (diff === 0) return `${strings.stats.same}`;
  return `${diff > 0 ? '+' : '−'}${Math.abs(diff)} ${strings.stats.vsPrev[kind]}`;
}

export function StatsView({ books, now, onOpen }: Props) {
  const [kind, setKind] = useState<PeriodKind>('month');
  const [period, setPeriod] = useState<Period>(() => currentPeriod('month', now));
  const [filter, setFilter] = useState<Filter>(null);

  const stats = useMemo(() => computeStats(books, period, now), [books, period, now]);
  const earliest = useMemo(() => earliestReading(books, now), [books, now]);
  const today = currentPeriod(kind, now);

  const canNext = periodRange(shiftPeriod(period, 1)).start <= now;
  const canPrev = earliest !== undefined && periodRange(period).start > earliest;

  function go(next: Period) {
    setPeriod(next);
    setFilter(null);
  }
  function switchKind(k: PeriodKind) {
    setKind(k);
    go(currentPeriod(k, now));
  }

  const range = periodRange(period);
  const visible = (
    filter?.kind === 'day' ? (stats.byDay.get(filter.day) ?? []) : stats.periodBooks
  ).filter((b) => {
    if (filter?.kind !== 'genre') return true;
    return filter.genre === NO_GENRE ? !b.genres?.length : !!b.genres?.includes(filter.genre);
  });

  /** Пометка для книги, которая читалась в период, но закончена не в нём. */
  function periodNote(b: Book): string | undefined {
    if (b.status === 'reading') return strings.stats.readingNow;
    if (b.finishedAt === undefined || (b.finishedAt >= range.start && b.finishedAt < range.end)) {
      return undefined;
    }
    return strings.stats.finishedOn(
      new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        b.finishedAt,
      ),
    );
  }

  const diff = delta(stats.count, stats.prevCount, kind);

  return (
    <section>
      <h1>{strings.stats.title}</h1>

      <div className="segmented" role="group" aria-label={strings.stats.periodSwitch}>
        {(['month', 'year'] as const).map((k) => (
          <button
            key={k}
            className={k === kind ? 'seg active' : 'seg'}
            aria-pressed={k === kind}
            onClick={() => switchKind(k)}
          >
            {strings.stats[k]}
          </button>
        ))}
      </div>

      <div className="period-nav">
        <button
          className="icon-btn"
          aria-label={strings.stats.prev}
          disabled={!canPrev}
          onClick={() => go(shiftPeriod(period, -1))}
        >
          ‹
        </button>
        <h2 aria-live="polite">{periodTitle(period)}</h2>
        <button
          className="icon-btn"
          aria-label={strings.stats.next}
          disabled={!canNext}
          onClick={() => go(shiftPeriod(period, 1))}
        >
          ›
        </button>
      </div>

      {stats.periodBooks.length === 0 ? (
        <div className="stats-empty">
          <p>{strings.stats.empty[kind]}</p>
          <p className="muted">{strings.stats.emptyHint}</p>
        </div>
      ) : (
        <>
          <div className="hero">
            <strong className="hero-num">{stats.count}</strong>
            <span>
              {formatBooks(stats.count).replace(/^\d+ /, '')} {strings.stats.read}
            </span>
            {diff && <span className="muted">{diff}</span>}
          </div>

          <div className="tiles">
            <Tile
              label={strings.stats.avgRating}
              value={stats.avgRating ? `★ ${stats.avgRating.toFixed(1)}` : '—'}
              note={
                stats.count > 0 ? strings.stats.ratedOf(stats.ratedCount, stats.count) : undefined
              }
            />
            <Tile
              label={strings.stats.avgDays}
              value={stats.avgDays ? formatDays(Math.round(stats.avgDays)) : '—'}
            />
            {stats.fastest && <BookTile label={strings.stats.fastest} item={stats.fastest} />}
            {stats.slowest && <BookTile label={strings.stats.slowest} item={stats.slowest} />}
            {stats.topAuthor && (
              <Tile
                label={strings.stats.topAuthor}
                value={stats.topAuthor.name}
                note={formatBooks(stats.topAuthor.count)}
              />
            )}
          </div>

          {kind === 'year' ? (
            <YearChart
              year={period.year}
              counts={stats.byMonth}
              currentMonth={period.year === today.year ? today.month : undefined}
              onPick={(m) => {
                setKind('month');
                go({ kind: 'month', year: period.year, month: m });
              }}
            />
          ) : (
            <MonthCalendar
              year={period.year}
              month={period.month}
              byDay={stats.byDay}
              selectedDay={filter?.kind === 'day' ? filter.day : null}
              onPick={(day) => setFilter(day ? { kind: 'day', day } : null)}
            />
          )}

          <GenreBars
            genres={stats.genres}
            selected={filter?.kind === 'genre' ? filter.genre : null}
            onPick={(genre) => setFilter(genre ? { kind: 'genre', genre } : null)}
          />

          <h3>
            {filter?.kind === 'genre'
              ? strings.stats.booksOfGenre(filter.genre)
              : filter?.kind === 'day'
                ? strings.stats.booksOfDay(
                    new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(
                      new Date(period.year, period.month, filter.day),
                    ),
                  )
                : strings.stats.booksOfPeriod}
            {filter && (
              <button className="link inline" onClick={() => setFilter(null)}>
                {strings.stats.resetFilter}
              </button>
            )}
          </h3>
          <ul className="book-list">
            {visible.map((b) => (
              <li key={b.id}>
                <button className="book-card" onClick={() => onOpen(b.id)}>
                  <Cover url={b.coverUrl} title={b.title} />
                  <span className="book-card-text">
                    <strong>{b.title}</strong>
                    <span className="muted">
                      {b.authors.join(', ') || strings.details.unknownAuthor}
                    </span>
                    <GenreChips genres={b.genres} />
                    {periodNote(b) && <span className="muted small">{periodNote(b)}</span>}
                    {b.rating && (
                      <span className="star on" aria-label={`Оценка ${b.rating} из 5`}>
                        {'★'.repeat(b.rating)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Tile({
  label,
  value,
  note,
  cover,
}: {
  label: string;
  value: string;
  note?: string | undefined;
  cover?: Book | undefined;
}) {
  return (
    <div className={cover ? 'tile tile-book' : 'tile'}>
      {cover && <Cover url={cover.coverUrl} title={cover.title} />}
      <div className="tile-body">
        <span className="tile-label">{label}</span>
        <strong className="tile-value">{value}</strong>
        {note && <span className="muted small">{note}</span>}
      </div>
    </div>
  );
}

function BookTile({ label, item }: { label: string; item: BookDays }) {
  return (
    <Tile label={label} value={item.book.title} note={formatDays(item.days)} cover={item.book} />
  );
}
