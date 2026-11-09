import type { Book } from './book';

export const MAX_GENRES = 3;
export const NO_GENRE = 'Без жанра';

/** Англоязычные категории каталогов → русские названия жанров. */
const KNOWN: Record<string, string> = {
  'science fiction': 'Фантастика',
  'sci-fi': 'Фантастика',
  fantasy: 'Фэнтези',
  mystery: 'Детектив',
  detective: 'Детектив',
  'detective and mystery stories': 'Детектив',
  thriller: 'Триллер',
  suspense: 'Триллер',
  horror: 'Ужасы',
  romance: 'Романтика',
  'love stories': 'Романтика',
  historical: 'Исторический роман',
  'historical fiction': 'Исторический роман',
  adventure: 'Приключения',
  classics: 'Классика',
  'classic literature': 'Классика',
  literary: 'Современная проза',
  'literary criticism': 'Литературоведение',
  'juvenile fiction': 'Детская литература',
  "children's stories": 'Детская литература',
  'young adult fiction': 'Подростковая литература',
  humor: 'Юмор',
  poetry: 'Поэзия',
  drama: 'Драма',
  biography: 'Биография',
  'biography & autobiography': 'Биография',
  autobiography: 'Биография',
  history: 'История',
  philosophy: 'Философия',
  psychology: 'Психология',
  'self-help': 'Саморазвитие',
  business: 'Бизнес',
  'business & economics': 'Бизнес',
  science: 'Наука',
  'popular science': 'Научпоп',
  technology: 'Технологии',
  computers: 'Компьютеры',
  'political science': 'Политика',
  religion: 'Религия',
  'social science': 'Общество',
  art: 'Искусство',
  cooking: 'Кулинария',
  travel: 'Путешествия',
  'true crime': 'Реальные преступления',
  'graphic novels': 'Графические романы',
  comics: 'Комиксы',
  'comics & graphic novels': 'Комиксы',
};

/** Слишком общие категории — тегами они не помогают. */
const GENERIC = new Set(['general', 'fiction', 'nonfiction', 'non-fiction', 'other']);

const clean = (raw: string) => raw.trim().replace(/\s+/g, ' ');

/** Приводит жанр к единому виду; пустую строку и слишком общие категории отбрасывает. */
export function normalizeGenre(raw: string): string | undefined {
  const text = clean(raw);
  if (!text) return undefined;
  const key = text.toLowerCase();
  if (GENERIC.has(key)) return undefined;
  const known = KNOWN[key];
  if (known) return known;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Нормализация списка: без пустых и дублей (без учёта регистра), не больше `limit`. */
export function normalizeGenres(list: readonly string[], limit = MAX_GENRES): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of list) {
    const genre = normalizeGenre(raw);
    if (!genre || seen.has(genre.toLowerCase())) continue;
    seen.add(genre.toLowerCase());
    result.push(genre);
    if (result.length >= limit) break;
  }
  return result;
}

/** Только жанры из словаря — для шумных источников вроде subject в Open Library. */
export function knownGenres(list: readonly string[], limit = MAX_GENRES): string[] {
  return normalizeGenres(
    list.filter((s) => clean(s).toLowerCase() in KNOWN),
    limit,
  );
}

/** Категории Google Books вида «Fiction / Science Fiction / General» → теги. */
export function genresFromCategories(categories: readonly string[]): string[] {
  return normalizeGenres(categories.flatMap((c) => c.split('/')));
}

/** Все жанры библиотеки, самые частые — первыми (для подсказок в поле тегов). */
export function collectGenres(books: readonly Book[]): string[] {
  const counts = new Map<string, number>();
  for (const b of books) {
    for (const g of b.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
    .map(([g]) => g);
}
