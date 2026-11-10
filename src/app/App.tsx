import { BackupView } from '../features/backup/BackupView';
import { BookDetails } from '../features/book-details/BookDetails';
import { SearchView } from '../features/search/SearchView';
import { ShelfView } from '../features/shelves/ShelfView';
import { StatsView } from '../features/stats/StatsView';
import { SHELVES } from '../domain/book';
import { Toast } from '../ui/Toast';
import { strings } from '../ui/strings';
import { useAppNavigation, type Tab } from './useAppNavigation';
import { useLibrary } from './useLibrary';

const TAB_LABELS: Record<Tab, string> = {
  ...strings.shelf,
  stats: strings.tabs.stats,
  search: strings.tabs.search,
  settings: strings.tabs.settings,
};
const TABS: Tab[] = [...SHELVES, 'stats', 'search', 'settings'];

export function App() {
  const { books, now, reload } = useLibrary();
  const { tab, openId, exitHint, selectTab, open, close } = useAppNavigation();

  return (
    <div className="app">
      <main>
        {openId ? (
          <BookDetails bookId={openId} now={now} onClose={close} onChanged={() => void reload()} />
        ) : tab === 'search' ? (
          <SearchView
            onAdded={(status) => {
              void reload();
              selectTab(status);
            }}
          />
        ) : tab === 'stats' ? (
          <StatsView books={books ?? []} now={now} onOpen={open} />
        ) : tab === 'settings' ? (
          <BackupView onImported={() => void reload()} />
        ) : (
          <ShelfView status={tab} books={books ?? []} now={now} onOpen={open} />
        )}
      </main>
      <Toast show={exitHint}>{strings.exitHint}</Toast>
      <nav className="tabbar" aria-label="Разделы">
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab && !openId ? 'tab active' : 'tab'}
            aria-current={t === tab && !openId ? 'page' : undefined}
            onClick={() => selectTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>
    </div>
  );
}
