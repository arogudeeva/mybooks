import { strings } from '../../ui/strings';
import { formatBooks } from '../../domain/stats';

interface Props {
  year: number;
  counts: readonly number[];
  /** Месяц, который сейчас идёт, если выбран текущий год. */
  currentMonth: number | undefined;
  onPick: (month: number) => void;
}

const monthName = (m: number, style: 'long' | 'short') =>
  new Intl.DateTimeFormat('ru', { month: style }).format(new Date(2000, m, 1)).replace('.', '');

/** 12 столбцов по месяцам; нажатие открывает месяц. */
export function YearChart({ year, counts, currentMonth, onPick }: Props) {
  const max = Math.max(1, ...counts);
  return (
    <figure className="chart">
      <figcaption className="chart-title">
        {strings.stats.chartYear}, {year}
      </figcaption>
      <ol className="year-chart">
        {counts.map((n, m) => (
          <li key={m}>
            <button
              className={m === currentMonth ? 'bar-col current' : 'bar-col'}
              aria-label={`${monthName(m, 'long')}: ${formatBooks(n)}`}
              onClick={() => onPick(m)}
            >
              <span className="bar-value">{n > 0 ? n : ''}</span>
              <span className="bar-track">
                <span
                  className={n > 0 ? 'bar' : 'bar bar-empty'}
                  style={{ height: n > 0 ? `${Math.max(8, (n / max) * 100)}%` : undefined }}
                />
              </span>
              <span className="bar-label">{monthName(m, 'short')}</span>
            </button>
          </li>
        ))}
      </ol>
    </figure>
  );
}
