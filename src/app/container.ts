import { FallbackCatalog } from '../adapters/catalog/FallbackCatalog';
import { GoogleBooksCatalog } from '../adapters/catalog/GoogleBooksCatalog';
import { OpenLibraryCatalog } from '../adapters/catalog/OpenLibraryCatalog';
import { IndexedDbBookRepository } from '../adapters/storage/IndexedDbBookRepository';
import type { BookCatalog } from '../ports/BookCatalog';
import type { BookRepository } from '../ports/BookRepository';
import { BackupService } from '../services/BackupService';
import { BookService } from '../services/BookService';

export interface Container {
  catalog: BookCatalog;
  books: BookService;
  backup: BackupService;
}

/** Единственное место, где выбираются конкретные реализации портов. */
export function createContainer(
  repo: BookRepository = new IndexedDbBookRepository(),
  catalog: BookCatalog = new FallbackCatalog([
    new GoogleBooksCatalog(undefined, import.meta.env.VITE_GOOGLE_BOOKS_API_KEY),
    new OpenLibraryCatalog(),
  ]),
): Container {
  return {
    catalog,
    books: new BookService(repo),
    backup: new BackupService(repo),
  };
}
