import type { Book } from './book';

export const BACKUP_VERSION = 2;
/** Версия 1 дополнительно содержала сессии таймера — при чтении они игнорируются. */
const SUPPORTED_VERSIONS = [1, 2];

export interface Backup {
  version: number;
  exportedAt: number;
  books: Book[];
}

export function parseBackup(raw: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Файл не является корректным JSON');
  }
  const b = data as Partial<Backup> | null;
  if (!b || typeof b !== 'object' || !Array.isArray(b.books)) {
    throw new Error('Файл не похож на резервную копию библиотеки');
  }
  if (typeof b.version !== 'number' || !SUPPORTED_VERSIONS.includes(b.version)) {
    throw new Error(`Неподдерживаемая версия резервной копии: ${String(b.version)}`);
  }
  return b as Backup;
}
