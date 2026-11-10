/** Короткая подсказка внизу экрана над панелью вкладок. */
export function Toast({ show, children }: { show: boolean; children: string }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {show && <div className="toast">{children}</div>}
    </div>
  );
}
