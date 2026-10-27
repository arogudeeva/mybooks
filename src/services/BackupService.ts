import { BACKUP_VERSION, parseBackup, type Backup } from '../domain/backup';
import type { BookRepository } from '../ports/BookRepository';
import { systemClock, type Clock } from './clock';

export class BackupService {
  constructor(
    private readonly repo: BookRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  async export(): Promise<string> {
    const backup: Backup = {
      version: BACKUP_VERSION,
      exportedAt: this.clock.now(),
      books: await this.repo.listBooks(),
    };
    return JSON.stringify(backup, null, 2);
  }

  /** Заменяет всю библиотеку данными из файла. */
  async import(raw: string): Promise<{ books: number }> {
    const backup = parseBackup(raw);
    await this.repo.replaceAll(backup.books);
    return { books: backup.books.length };
  }
}
