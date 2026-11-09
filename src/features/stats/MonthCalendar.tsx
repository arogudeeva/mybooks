import type { Book } from '../../domain/book';
import { daysInMonth } from '../../domain/stats';
import { strings } from '../../ui/strings';

const MAX_COVERS = 2;

interface Props {
  year: number;
  month: number;
  byDay: ReadonlyMap<number, Book[]>;
  selectedDay: number | null;
  onPick: (day: number | null) => void;
}

/** Календарь месяца с понедельника: в каждый день, когда читалась книга, показана её обложка. */
export function MonthCalendar({ year, month, byDay, selectedDay, onPick }: Props) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  return (
    <figure className="chart">
      <figcaption className="chart-title">{strings.stats.chartMonth}</figcaption>
      <div className="calendar" role="grid">
        {strings.stats.weekdays.map((w) => (
          <span key={w} className="cal-head" role="columnheader">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} role="gridcell" />
        ))}
        {days.map((d) => {
          const items = byDay.get(d) ?? [];
          if (items.length === 0) {
            return (
              <span key={d} className="cal-day" role="gridcell">
                <span className="cal-num">{d}</span>
              </span>
            );
          }
          const shown = items.slice(0, MAX_COVERS);
          const rest = items.length - shown.length;
          return (
            <button
              key={d}
              role="gridcell"
              className={d === selectedDay ? 'cal-day done selected' : 'cal-day done'}
              aria-pressed={d === selectedDay}
              aria-label={`${d}: ${items.map((b) => b.title).join(', ')}`}
              onClick={() => onPick(d === selectedDay ? null : d)}
            >
              <span className="cal-num">{d}</span>
              <span className="cal-covers" aria-hidden="true">
                {shown.map((b) =>
                  b.coverUrl ? (
                    <img key={b.id} className="cal-cover" src={b.coverUrl} alt="" loading="lazy" />
                  ) : (
                    <span key={b.id} className="cal-cover cal-cover-empty">
                      {b.title.slice(0, 1).toUpperCase()}
                    </span>
                  ),
                )}
                {rest > 0 && <span className="cal-more">+{rest}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </figure>
  );
}
