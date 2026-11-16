import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

/** Simple stacked-stone waymark icon. */
export function StoneIcon({ size = 36, reached, draft }: { size?: number; reached?: 'Yes' | 'Partly' | 'Not yet' | null; draft?: boolean }) {
  const fill = reached === 'Yes' ? '#2F5D50' : reached === 'Partly' ? '#7FA195' : draft ? 'none' : '#D9D3C4';
  const stroke = reached === 'Yes' ? '#23473D' : '#7C776B';
  const dash = draft ? '3 2' : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <ellipse cx="20" cy="32" rx="15" ry="5" fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash} />
      <ellipse cx="20" cy="23.5" rx="11" ry="4.5" fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash} />
      <ellipse cx="20" cy="15.5" rx="7.5" ry="4" fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash} />
      <ellipse cx="20" cy="9" rx="4.5" ry="3" fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash} />
    </svg>
  );
}

/** Bottom sheet on phones, side panel on desktop. */
export function Sheet({ open, onClose, title, children, wide, fid }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; fid?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" data-feedback-ui />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-feedback-id={fid}
        className={`absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-paper shadow-xl outline-none md:bottom-0 md:left-auto md:top-0 md:max-h-none md:rounded-none md:rounded-l-2xl ${wide ? 'md:w-[560px]' : 'md:w-[440px]'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-paper/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto h-1 w-10 rounded bg-line md:hidden absolute left-1/2 top-1.5 -translate-x-1/2" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold pt-1">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="tap -mr-2">
            <IconClose />
          </button>
        </div>
        <div className="px-4 pb-8 pt-3">{children}</div>
      </div>
    </div>
  );
}

export function Chip({ children, onClick, active, label, fid }: { children: ReactNode; onClick?: () => void; active?: boolean; label?: string; fid?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      data-feedback-id={fid}
      className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${active ? 'border-accent bg-accent text-white' : 'border-line bg-card text-ink hover:border-accent'}`}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, dark }: { checked: boolean; onChange: (v: boolean) => void; label: string; dark?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-[44px] items-center gap-2 text-sm">
      <span className={`relative inline-block h-6 w-10 rounded-full transition-colors ${checked ? (dark ? 'bg-dev-amber' : 'bg-accent') : 'bg-[#BDB6A6]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full min-h-[44px] rounded-lg border border-line bg-card px-3 py-2 text-base text-ink focus:border-accent';

export function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly T[]; label: string }) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Btn({ children, onClick, kind = 'primary', type = 'button', label, fid, className = '', disabled }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'quiet' | 'danger'; type?: 'button' | 'submit'; label?: string; fid?: string; className?: string; disabled?: boolean }) {
  const k = {
    primary: 'bg-accent text-white hover:bg-accent-ink',
    ghost: 'border border-line bg-card text-ink hover:border-accent',
    quiet: 'text-accent-ink hover:bg-accent-soft',
    danger: 'border border-[#B3261E] text-[#B3261E] hover:bg-[#FBEAEA]',
  }[kind];
  return (
    <button type={type} onClick={onClick} aria-label={label} data-feedback-id={fid} disabled={disabled} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${k} ${className}`}>
      {children}
    </button>
  );
}
