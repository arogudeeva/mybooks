interface Props {
  genres: readonly string[] | undefined;
  /** Сколько чипов показать, остальные сворачиваются в «+N». */
  max?: number;
}

/** Только для чтения: жанры книги в карточке списка. */
export function GenreChips({ genres, max = 3 }: Props) {
  if (!genres?.length) return null;
  const shown = genres.slice(0, max);
  const rest = genres.length - shown.length;
  return (
    <span className="chips">
      {shown.map((g) => (
        <span key={g} className="chip">
          {g}
        </span>
      ))}
      {rest > 0 && <span className="chip chip-more">+{rest}</span>}
    </span>
  );
}
