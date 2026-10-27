import type { Rating } from '../domain/book';

interface Props {
  value: Rating | undefined;
  onChange: (value: Rating | undefined) => void;
}

export function StarRating({ value, onChange }: Props) {
  return (
    <div className="stars" role="radiogroup" aria-label="Оценка">
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} из 5`}
          className={value !== undefined && n <= value ? 'star on' : 'star'}
          onClick={() => onChange(value === n ? undefined : n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
