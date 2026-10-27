import type { ShelfStatus } from '../domain/book';

/** Все тексты интерфейса — в одном месте, чтобы позже можно было добавить другие языки. */
export const strings = {
  appName: 'Мои книги',
  shelf: { reading: 'Читаю', finished: 'Прочитано', want: 'Хочу прочитать' } satisfies Record<
    ShelfStatus,
    string
  >,
  shelfEmpty: {
    reading: 'Пока ничего не читаете. Найдите книгу через поиск.',
    finished: 'Здесь появятся прочитанные книги.',
    want: 'Добавьте книги, которые хотите прочитать.',
  } satisfies Record<ShelfStatus, string>,
  tabs: { search: 'Поиск', settings: 'Ещё' },
  search: {
    placeholder: 'Название книги или автор',
    searching: 'Ищем…',
    nothing: 'Ничего не найдено',
    error: 'Не удалось выполнить поиск. Проверьте интернет и попробуйте ещё раз.',
    addTo: 'Добавить в:',
    added: 'Уже в библиотеке',
  },
  details: {
    back: 'Назад',
    noDescription: 'Описание отсутствует',
    unknownAuthor: 'Автор неизвестен',
    moveTo: 'Переместить в',
    rating: 'Моя оценка',
    notes: 'Заметки',
    notesPlaceholder: 'Что думаете об этой книге?',
    delete: 'Удалить книгу',
    confirmDelete: 'Удалить книгу и всю историю чтения?',
  },
  period: {
    startedAt: 'Начала читать',
    finishedAt: 'Закончила',
    readingFor: 'Читаю',
    readIn: 'Прочитано за',
    notSet: 'не указано',
  },
  backup: {
    title: 'Резервная копия',
    hint: 'Данные хранятся только на этом устройстве. Сохраняйте копию, чтобы не потерять библиотеку.',
    export: 'Скачать копию',
    import: 'Загрузить из файла',
    confirmImport: 'Текущая библиотека будет заменена данными из файла. Продолжить?',
    imported: (b: number) => `Загружено книг: ${b}`,
  },
};
