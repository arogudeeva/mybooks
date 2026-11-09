import { useState } from 'react';
import type { GenreStat } from '../../domain/stats';
import { strings } from '../../ui/strings';

interface Props {
  genres: readonly GenreStat[];
  selected: string | null;
  onPick: (genre: string | null) => void;
}

const TOP = 6;

/** Полосы по жанрам: длина — число книг, справа средняя оценка. */
export function GenreBars({ genres, selected, onPick }: Props) {
  const [all, setAll] = useState(false);
  if (genres.length === 0) return null;
  const max = Math.max(...genres.map((g) => g.count));
  const shown = all ? genres : genres.slice(0, TOP);
  const hidden = genres.length - TOP;

  return (
    <section aria-labelledby="genre-stats">
      <h3 id="genre-stats">{strings.stats.genres}</h3>
      <ul className="genre-bars">
        {shown.map((g) => (
          <li key={g.genre}>
            <button
              className={g.genre === selected ? 'genre-row selected' : 'genre-row'}
              aria-pressed={g.genre === selected}
              onClick={() => onPick(g.genre === selected ? null : g.genre)}
            >
              <span className="genre-name">{g.genre}</span>
              <span className="genre-track" aria-hidden="true">
                <span className="genre-fill" style={{ width: `${(g.count / max) * 100}%` }} />
              </span>
              <span className="genre-num">{g.count}</span>
              <span
                className="genre-rating"
                aria-label={g.avgRating ? `оценка ${g.avgRating.toFixed(1)}` : 'нет оценок'}
              >
                {g.avgRating ? `★ ${g.avgRating.toFixed(1)}` : '—'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button className="link" onClick={() => setAll(!all)}>
          {all ? strings.stats.lessGenres : strings.stats.moreGenres(hidden)}
        </button>
      )}
      <p className="muted small">{strings.stats.genresNote}</p>
    </section>
  );
}
