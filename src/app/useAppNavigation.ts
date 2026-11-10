import { useCallback, useEffect, useRef, useState } from 'react';

export type Tab = 'reading' | 'finished' | 'want' | 'stats' | 'search' | 'settings';

export const HOME_TAB: Tab = 'reading';
const EXIT_WINDOW_MS = 2000;

interface Nav {
  tab: Tab;
  openId: string | null;
}

/** Что лежит в history.state; запись без `app` — самая нижняя, за ней идёт выход из приложения. */
type HistoryState = Nav & { app: true };

const entry = (nav: Nav): HistoryState => ({ app: true, ...nav });
const isEntry = (state: unknown): state is HistoryState =>
  typeof state === 'object' && state !== null && 'app' in state && state.app === true;

/**
 * Экран приложения и кнопка «назад» на телефоне.
 *
 * Над стартовой записью истории лежит страховочная запись, поэтому системная «назад»
 * не закрывает приложение сразу: карточка книги закрывается, с другой вкладки возвращает на
 * «Читаю», а на «Читаю» нужно нажать дважды (первое нажатие показывает подсказку).
 * Страховочная запись создаётся при первом касании: браузер пропускает записи истории,
 * добавленные без действия пользователя.
 */
export function useAppNavigation() {
  const [nav, setNav] = useState<Nav>({ tab: HOME_TAB, openId: null });
  const [exitHint, setExitHint] = useState(false);
  const navRef = useRef(nav);
  const armed = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingTab = useRef<Tab | null>(null);

  const apply = useCallback((next: Nav) => {
    navRef.current = next;
    setNav(next);
  }, []);

  useEffect(() => {
    window.history.replaceState({ app: false }, '');

    const arm = () => {
      if (armed.current) return;
      armed.current = true;
      window.history.pushState(entry(navRef.current), '');
    };

    const onPop = (e: PopStateEvent) => {
      if (isEntry(e.state)) {
        const wanted = pendingTab.current;
        pendingTab.current = null;
        if (wanted) {
          const next = { tab: wanted, openId: null };
          window.history.replaceState(entry(next), '');
          apply(next);
        } else {
          apply({ tab: e.state.tab, openId: e.state.openId });
        }
        return;
      }
      // Дошли до самой нижней записи: возвращаем страховочную или выходим.
      if (navRef.current.tab !== HOME_TAB || navRef.current.openId) {
        apply({ tab: HOME_TAB, openId: null });
        window.history.pushState(entry(navRef.current), '');
      } else if (exitTimer.current) {
        clearTimeout(exitTimer.current);
        exitTimer.current = undefined;
        setExitHint(false);
        armed.current = false;
        window.history.back();
      } else {
        setExitHint(true);
        exitTimer.current = setTimeout(() => {
          exitTimer.current = undefined;
          setExitHint(false);
        }, EXIT_WINDOW_MS);
        window.history.pushState(entry(navRef.current), '');
      }
    };

    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      window.removeEventListener('popstate', onPop);
      clearTimeout(exitTimer.current);
    };
  }, [apply]);

  const selectTab = useCallback(
    (tab: Tab) => {
      if (navRef.current.openId && armed.current) {
        // Сначала закрываем запись карточки, затем применяем вкладку (см. onPop).
        pendingTab.current = tab;
        window.history.back();
        return;
      }
      const next = { tab, openId: null };
      if (armed.current) window.history.replaceState(entry(next), '');
      apply(next);
    },
    [apply],
  );

  const open = useCallback(
    (openId: string) => {
      const next = { tab: navRef.current.tab, openId };
      if (armed.current) window.history.pushState(entry(next), '');
      apply(next);
    },
    [apply],
  );

  const close = useCallback(() => {
    if (armed.current && navRef.current.openId) window.history.back();
    else apply({ tab: navRef.current.tab, openId: null });
  }, [apply]);

  return { ...nav, exitHint, selectTab, open, close };
}
