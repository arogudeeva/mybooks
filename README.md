# Мои книги

PWA-приложение для телефона: полки «Читаю», «Прочитано», «Хочу прочитать»; поиск книг по названию
(обложка и описание подтягиваются из Google Books, запасной источник — Open Library); даты чтения (старт фиксируется при переносе в «Читаю», окончание — в «Прочитано», дни считаются автоматически); оценка и заметки для прочитанных; резервная копия в JSON.

Данные хранятся в IndexedDB на устройстве. Сервер не нужен.

## Запуск

Нужен Node.js 20+.

```bash
npm install
npm run dev        # разработка
npm test           # тесты
npm run lint       # линтер
npm run build      # сборка в dist/
npm run preview    # проверить собранную версию (в т.ч. PWA)
```

Необязательно: личный ключ Google Books (если поиск отвечает 429) — в файл `.env.local`:
`VITE_GOOGLE_BOOKS_API_KEY=...`

## Установка на телефон

Выложите содержимое `dist/` на любой статический хостинг с HTTPS (GitHub Pages, Netlify,
Cloudflare Pages), откройте адрес в телефоне и выберите «Добавить на главный экран».
Делайте резервную копию во вкладке «Ещё».

## Архитектура

Зависимости направлены вниз: `features/app → services → ports ← adapters`, `domain` ни от чего не зависит.

| Папка | Назначение |
|---|---|
| `src/domain` | Типы и чистая логика (книга, период чтения, бэкап) |
| `src/ports` | Интерфейсы: `BookRepository` (хранилище), `BookCatalog` (поиск книг) |
| `src/adapters` | Реализации: IndexedDB, Google Books, Open Library, `FallbackCatalog` |
| `src/services` | Сценарии: `BookService`, `BackupService` |
| `src/app` | Сборка зависимостей (`container.ts`), корневой компонент |
| `src/features` | Экраны по фичам: shelves, search, book-details, backup |
| `src/ui` | Общие компоненты, стили, все тексты (`strings.ts`) |

## Как расширять

- **Новый источник книг:** класс, реализующий `BookCatalog`, и добавление в `FallbackCatalog` в `app/container.ts`.
- **Синхронизация между устройствами:** `RemoteBookRepository` (реализация `BookRepository` поверх HTTP) и замена в `container.ts`.
  Прогоните её через контрактные тесты из `adapters/storage/bookRepository.contract.test.ts` (`describeBookRepository`).
  У записей уже есть `id` (UUID) и `updatedAt`.
- **Изменение схемы данных:** увеличить `DB_VERSION` и добавить ветку `if (oldVersion < N)` в `IndexedDbBookRepository`;
  при несовместимости формата бэкапа — поднять `BACKUP_VERSION`.
- **Новая фича:** папка в `src/features/`, сервис в `src/services/`, подключение в `container.ts` и `App.tsx`.
- **Тексты/языки:** всё в `src/ui/strings.ts`.

## Известные ограничения

- iOS не умеет SVG-иконки для главного экрана: для красивой иконки на iPhone добавьте PNG 180×180 и ссылку `apple-touch-icon`.
- Данные живут на одном устройстве — пользуйтесь экспортом.
