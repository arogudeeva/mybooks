import { useState } from 'react';
import { useContainer } from '../../app/ContainerContext';
import { SHELVES, type BookDraft, type ShelfStatus } from '../../domain/book';
import { Cover } from '../../ui/Cover';
import { strings } from '../../ui/strings';
import { useDebouncedSearch } from './useDebouncedSearch';

interface Props {
  onAdded: (status: ShelfStatus) => void;
}

export function SearchView({ onAdded }: Props) {
  const { catalog, books } = useContainer();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const state = useDebouncedSearch(catalog, query);

  const keyOf = (d: BookDraft) => `${d.source}:${d.externalId}`;
  const withDescription = (d: BookDraft): BookDraft => {
    const text = d.description ?? descriptions[keyOf(d)];
    return text ? { ...d, description: text } : d;
  };

  function toggle(d: BookDraft) {
    const key = keyOf(d);
    const opening = expanded !== key;
    setExpanded(opening ? key : null);
    if (opening && !d.description && !(key in descriptions)) {
      catalog
        .describe?.(d)
        .then((text) => text && setDescriptions((prev) => ({ ...prev, [key]: text })))
        .catch(() => undefined);
    }
  }

  async function add(draft: BookDraft, status: ShelfStatus) {
    await books.add(withDescription(draft), status);
    onAdded(status);
  }

  return (
    <section>
      <h1>{strings.tabs.search}</h1>
      <input
        type="search"
        className="input"
        placeholder={strings.search.placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {state.kind === 'loading' && <p className="muted">{strings.search.searching}</p>}
      {state.kind === 'error' && <p className="error">{strings.search.error}</p>}
      {state.kind === 'done' && state.results.length === 0 && (
        <p className="muted">{strings.search.nothing}</p>
      )}
      {state.kind === 'done' && (
        <ul className="book-list">
          {state.results.map((d) => {
            const key = keyOf(d);
            const open = expanded === key;
            const shown = withDescription(d);
            return (
              <li key={key} className="search-item">
                <button className="book-card" onClick={() => toggle(d)}>
                  <Cover url={d.coverUrl} title={d.title} />
                  <span className="book-card-text">
                    <strong>{d.title}</strong>
                    <span className="muted">
                      {d.authors.join(', ') || strings.details.unknownAuthor}
                    </span>
                    {shown.description && (
                      <span className={open ? '' : 'clamp'}>{shown.description}</span>
                    )}
                  </span>
                </button>
                {open && (
                  <div className="actions">
                    <span className="muted">{strings.search.addTo}</span>
                    {SHELVES.map((s) => (
                      <button key={s} className="btn" onClick={() => void add(d, s)}>
                        {strings.shelf[s]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
