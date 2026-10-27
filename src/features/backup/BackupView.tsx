import { useRef, useState } from 'react';
import { useContainer } from '../../app/ContainerContext';
import { strings } from '../../ui/strings';

export function BackupView({ onImported }: { onImported: () => void }) {
  const { backup } = useContainer();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  async function exportFile() {
    const blob = new Blob([await backup.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `books-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importFile(file: File) {
    if (!window.confirm(strings.backup.confirmImport)) return;
    try {
      const { books } = await backup.import(await file.text());
      setMessage(strings.backup.imported(books));
      onImported();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section>
      <h1>{strings.backup.title}</h1>
      <p className="muted">{strings.backup.hint}</p>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => void exportFile()}>
          {strings.backup.export}
        </button>
        <button className="btn" onClick={() => fileInput.current?.click()}>
          {strings.backup.import}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
