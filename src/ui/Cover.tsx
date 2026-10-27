interface Props {
  url?: string;
  title: string;
  size?: 'sm' | 'lg';
}

export function Cover({ url, title, size = 'sm' }: Props) {
  return url ? (
    <img className={`cover cover-${size}`} src={url} alt={`Обложка: ${title}`} loading="lazy" />
  ) : (
    <div className={`cover cover-${size} cover-empty`} aria-hidden="true">
      {title.slice(0, 1).toUpperCase()}
    </div>
  );
}
