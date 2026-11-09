import { useId, useState } from 'react';
import { normalizeGenre } from '../../domain/genres';
import { strings } from '../../ui/strings';

interface Props {
  genres: readonly string[];
  /** Жанры, уже использованные в библиотеке, — для подсказок. */
  suggestions: readonly string[];
  onChange: (genres: string[]) => void;
}

/** Редактор жанров-тегов: убрать, выбрать из существующих или вписать свой. */
export function GenreTags({ genres, suggestions, onChange }: Props) {
  const [text, setText] = useState('');
  const listId = useId();
  const has = (g: string) => genres.some((x) => x.toLowerCase() === g.toLowerCase());
  const available = suggestions.filter((g) => !has(g));

  function add(raw: string) {
    const genre = normalizeGenre(raw);
    setText('');
    if (genre && !has(genre)) onChange([...genres, genre]);
  }

  return (
    <div className="genre-tags">
      <h3>{strings.details.genres}</h3>
      <div className="chips">
        {genres.length === 0 && <span className="muted">{strings.details.genresEmpty}</span>}
        {genres.map((g) => (
          <button
            key={g}
            className="chip chip-removable"
            aria-label={strings.details.genresRemove(g)}
            onClick={() => onChange(genres.filter((x) => x !== g))}
          >
            {g} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
      {available.length > 0 && (
        <div className="chips chips-suggest" aria-label={strings.details.genresAdd}>
          {available.slice(0, 12).map((g) => (
            <button key={g} className="chip chip-add" onClick={() => add(g)}>
              + {g}
            </button>
          ))}
        </div>
      )}
      <form
        className="genre-form"
        onSubmit={(e) => {
          e.preventDefault();
          add(text);
        }}
      >
        <input
          className="input"
          list={listId}
          placeholder={strings.details.genresPlaceholder}
          aria-label={strings.details.genresPlaceholder}
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === ',') {
              e.preventDefault();
              add(text);
            }
          }}
        />
        <datalist id={listId}>
          {available.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <button type="submit" className="btn" disabled={!text.trim()}>
          {strings.details.genresAdd}
        </button>
      </form>
    </div>
  );
}
