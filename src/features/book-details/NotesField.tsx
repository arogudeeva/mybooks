import { useEffect, useRef, useState } from 'react';
import { strings } from '../../ui/strings';

interface Props {
  value: string;
  onSave: (value: string) => void;
}

/** Текстовое поле с автосохранением после паузы в наборе. */
export function NotesField({ value, onSave }: Props) {
  const [text, setText] = useState(value);
  const saved = useRef(value);
  const latest = useRef({ text, onSave });

  useEffect(() => {
    latest.current = { text, onSave };
  });

  useEffect(() => {
    if (text === saved.current) return;
    const id = setTimeout(() => {
      saved.current = text;
      onSave(text);
    }, 600);
    return () => clearTimeout(id);
  }, [text, onSave]);

  // Сохраняем несохранённое при закрытии страницы книги.
  useEffect(
    () => () => {
      if (latest.current.text !== saved.current) latest.current.onSave(latest.current.text);
    },
    [],
  );

  return (
    <label className="field">
      <span>{strings.details.notes}</span>
      <textarea
        className="input"
        rows={6}
        placeholder={strings.details.notesPlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </label>
  );
}
