import type { BookCatalog } from '../../ports/BookCatalog';
import { draft } from '../../test/fakes';
import { FallbackCatalog } from './FallbackCatalog';
import { GoogleBooksCatalog } from './GoogleBooksCatalog';
import { OpenLibraryCatalog } from './OpenLibraryCatalog';

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response);

describe('GoogleBooksCatalog', () => {
  it('преобразует ответ и переводит обложку на https', async () => {
    const fetchFn = vi.fn(() =>
      json({
        items: [
          {
            id: 'g1',
            volumeInfo: {
              title: 'Книга',
              authors: ['А'],
              description: 'Описание',
              imageLinks: { thumbnail: 'http://img/1' },
            },
          },
          { id: 'g2', volumeInfo: {} },
        ],
      }),
    );
    const res = await new GoogleBooksCatalog(fetchFn as unknown as typeof fetch).search('книга');
    expect(res).toEqual([
      {
        source: 'google-books',
        externalId: 'g1',
        title: 'Книга',
        authors: ['А'],
        description: 'Описание',
        coverUrl: 'https://img/1',
      },
    ]);
  });

  it('бросает ошибку при HTTP-ошибке', async () => {
    const f = vi.fn(() => json({}, false));
    await expect(
      new GoogleBooksCatalog(f as unknown as typeof fetch).search('x'),
    ).rejects.toThrow();
  });
});

describe('OpenLibraryCatalog', () => {
  const search = () =>
    json({ docs: [{ key: '/works/OL1W', title: 'Dune', author_name: ['Herbert'], cover_i: 42 }] });

  it('собирает обложку и не делает лишних запросов за описаниями', async () => {
    const f = vi.fn(search);
    const [book] = await new OpenLibraryCatalog(f as unknown as typeof fetch).search('dune');
    expect(book?.coverUrl).toBe('https://covers.openlibrary.org/b/id/42-M.jpg');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('догружает описание по запросу', async () => {
    const f = vi.fn(() => json({ description: { value: 'Пустыня' } }));
    const catalog = new OpenLibraryCatalog(f as unknown as typeof fetch);
    expect(await catalog.describe(draft({ externalId: '/works/OL1W' }))).toBe('Пустыня');
  });
});

describe('FallbackCatalog', () => {
  const failing: BookCatalog = { name: 'f', search: () => Promise.reject(new Error('boom')) };
  const empty: BookCatalog = { name: 'e', search: () => Promise.resolve([]) };
  const ok: BookCatalog = { name: 'o', search: () => Promise.resolve([draft()]) };

  it('переходит к следующему каталогу при ошибке и пустом ответе', async () => {
    expect(await new FallbackCatalog([failing, empty, ok]).search('q')).toHaveLength(1);
  });
  it('возвращает пустой список, если каталоги ответили пусто', async () => {
    expect(await new FallbackCatalog([empty]).search('q')).toEqual([]);
  });
  it('пробрасывает ошибку, если все каталоги упали', async () => {
    await expect(new FallbackCatalog([failing, failing]).search('q')).rejects.toThrow('boom');
  });

  it('делегирует догрузку описания каталогу-владельцу', async () => {
    const owner: BookCatalog = {
      name: 'test',
      search: () => Promise.resolve([]),
      describe: () => Promise.resolve('текст'),
    };
    expect(await new FallbackCatalog([owner]).describe(draft())).toBe('текст');
  });
});
