import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IndexedDbBookRepository } from '../adapters/storage/IndexedDbBookRepository';
import type { BookCatalog } from '../ports/BookCatalog';
import { draft } from '../test/fakes';
import { App } from './App';
import { ContainerProvider } from './ContainerContext';
import { createContainer } from './container';

let n = 0;
function renderApp() {
  const catalog: BookCatalog = { name: 'fake', search: () => Promise.resolve([draft()]) };
  const container = createContainer(new IndexedDbBookRepository(`ui-db-${++n}`), catalog);
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
});
