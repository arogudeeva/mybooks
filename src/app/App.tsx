import { useState } from 'react';
import { BackupView } from '../features/backup/BackupView';
import { BookDetails } from '../features/book-details/BookDetails';
import { SearchView } from '../features/search/SearchView';
import { ShelfView } from '../features/shelves/ShelfView';
import { SHELVES } from '../domain/book';
import { strings } from '../ui/strings';
import { useLibrary } from './useLibrary';

type Tab = 'reading' | 'finished' | 'want' | 'search' | 'settings';

const TAB_LABELS: Record<Tab, string> = {
  ...strings.shelf,
  search: strings.tabs.search,
  settings: strings.tabs.settings,
};
const TABS: Tab[] = [...SHELVES, 'search', 'settings'];

export function App() {
  const { books, now, reload } = useLibrary();
  const [tab, setTab] = useState<Tab>('reading');
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="app">
      <main>
        {openId ? (
          <BookDetails
            bookId={openId}
            now={now}
            onClose={() => setOpenId(null)}
            onChanged={() => void reload()}
          />
        ) : tab === 'search' ? (
          <SearchView
            onAdded={(status) => {
              void reload();
              setTab(status);
            }}
          />
        ) : tab === 'settings' ? (
          <BackupView onImported={() => void reload()} />
        ) : (
          <ShelfView status={tab} books={books ?? []} now={now} onOpen={setOpenId} />
        )}
      </main>
      <nav className="tabbar" aria-label="Разделы">
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab && !openId ? 'tab active' : 'tab'}
            aria-current={t === tab && !openId ? 'page' : undefined}
            onClick={() => {
              setOpenId(null);
              setTab(t);
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>
    </div>
  );
}
