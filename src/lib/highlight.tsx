import type { ReactNode } from 'react';

/** Render text with the first case-insensitive match of `quote` marked. */
export function highlight(text: string, quote?: string | null, cls = 'src'): ReactNode {
  if (!quote) return text;
  const i = text.toLowerCase().indexOf(quote.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className={cls}>{text.slice(i, i + quote.length)}</mark>
      {text.slice(i + quote.length)}
    </>
  );
}
