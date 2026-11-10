import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IndexedDbBookRepository } from '../adapters/storage/IndexedDbBookRepository';
import type { BookCatalog } from '../ports/BookCatalog';
import { draft } from '../test/fakes';
import { App } from './App';
import { ContainerProvider } from './ContainerContext';
import { createContainer } from './container';

let n = 0;
type Container = ReturnType<typeof createContainer>;

function renderApp(seed?: (c: Container) => Promise<void>) {
  const catalog: BookCatalog = { name: 'fake', search: () => Promise.resolve([draft()]) };
  const container = createContainer(new IndexedDbBookRepository(`ui-db-${++n}`), catalog);
  return seed ? seed(container).then(() => show(container)) : show(container);
}

function show(container: Container) {
  render(
    <ContainerProvider container={container}>
      <App />
    </ContainerProvider>,
  );
}

describe('App', () => {
  it('находит книгу, добавляет на полку «Прочитано» и позволяет поставить оценку', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Поиск' }));
    await user.type(screen.getByPlaceholderText(/Название книги/), 'мастер');
    await user.click(await screen.findByText('Мастер и Маргарита'));
    await user.click(
      within(screen.getByRole('listitem')).getByRole('button', { name: 'Прочитано' }),
    );

    await screen.findByRole('heading', { name: 'Прочитано' });
    await user.click(await screen.findByRole('button', { name: /Мастер и Маргарита/ }));
    await user.click(await screen.findByRole('radio', { name: '5 из 5' }));
    expect(await screen.findByRole('radio', { name: '5 из 5', checked: true })).toBeInTheDocument();
  });

  it('показывает прочитанную книгу в статистике и позволяет добавить жанр', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Поиск' }));
    await user.type(screen.getByPlaceholderText(/Название книги/), 'мастер');
    await user.click(await screen.findByText('Мастер и Маргарита'));
    await user.click(
      within(screen.getByRole('listitem')).getByRole('button', { name: 'Прочитано' }),
    );
    await screen.findByRole('heading', { name: 'Прочитано' });
    await user.click(await screen.findByRole('button', { name: /Мастер и Маргарита/ }));
    await user.type(screen.getByLabelText('Свой жанр'), 'Классика,');
    await user.click(await screen.findByRole('button', { name: 'Убрать жанр Классика' }));
    await user.type(screen.getByLabelText('Свой жанр'), 'Роман{Enter}');
    await screen.findByRole('button', { name: 'Убрать жанр Роман' });
    await user.click(screen.getByRole('button', { name: /Назад/ }));

    await user.click(screen.getByRole('button', { name: 'Статистика' }));
    expect(await screen.findByRole('button', { name: /^Роман/ })).toBeInTheDocument();
    expect(screen.getByText('Мастер и Маргарита')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Следующий период' })).toBeDisabled();
  });

  it('сортирует полки: «хочу» по алфавиту, «прочитано» по дате окончания', async () => {
    const user = userEvent.setup();
    await renderApp(async ({ books }) => {
      for (const title of ['Вода', 'Арбуз', 'Берег']) {
        await books.add(draft({ externalId: title, title }), 'want');
      }
      const old = await books.add(draft({ externalId: 'o', title: 'Старая' }), 'finished');
      const fresh = await books.add(draft({ externalId: 'f', title: 'Новая' }), 'finished');
      await books.setDates(old.id, { finishedAt: new Date(2026, 0, 5, 12).getTime() });
      await books.setDates(fresh.id, { finishedAt: new Date(2026, 5, 5, 12).getTime() });
    });
    const titles = () =>
      screen.getAllByRole('listitem').map((li) => within(li).getByRole('strong').textContent);

    await user.click(screen.getByRole('button', { name: 'Хочу прочитать' }));
    expect(titles()).toEqual(['Арбуз', 'Берег', 'Вода']);
    await user.click(screen.getByRole('button', { name: 'Прочитано' }));
    expect(titles()).toEqual(['Новая', 'Старая']);
  });

  it('сохраняет пометку «кто посоветовал» и показывает её на полке «Хочу прочитать»', async () => {
    const user = userEvent.setup();
    await renderApp(async ({ books }) => void (await books.add(draft(), 'want')));

    await user.click(screen.getByRole('button', { name: 'Хочу прочитать' }));
    await user.click(await screen.findByRole('button', { name: /Мастер и Маргарита/ }));
    await user.type(screen.getByLabelText('Откуда узнала о книге'), 'посоветовала Аня');
    await user.click(screen.getByRole('button', { name: /Назад/ }));
    expect(await screen.findByText('Совет: посоветовала Аня')).toBeInTheDocument();
  });

  it('кнопка «назад» закрывает карточку, а на главной просит нажать ещё раз', async () => {
    const user = userEvent.setup();
    await renderApp(async ({ books }) => void (await books.add(draft(), 'reading')));

    await user.click(await screen.findByRole('button', { name: /Мастер и Маргарита/ }));
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();
    act(() => window.history.back());
    await waitFor(() => expect(screen.queryByRole('button', { name: /Назад/ })).toBeNull());
    expect(screen.getByRole('heading', { name: 'Читаю' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Статистика' }));
    act(() => window.history.back());
    expect(await screen.findByRole('heading', { name: 'Читаю' })).toBeInTheDocument();

    act(() => window.history.back());
    expect(await screen.findByText('Нажмите ещё раз, чтобы выйти')).toBeInTheDocument();
  });
});
