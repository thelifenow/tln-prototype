import { FORM_LABELS, type Confidence, type FilledForm } from '../types';
import { isField } from '../lib/field';

const conf: Record<Confidence, string> = {
  high: 'text-dev-cyan border-dev-cyan/50',
  medium: 'text-dev-amber border-dev-amber/50',
  low: 'text-dev-red border-dev-red/50',
};
const confNum: Record<Confidence, string> = { high: '0.9', medium: '0.6', low: '0.3' };

const words = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toLowerCase());

function show(v: unknown): string {
  if (v === '' || v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.length ? v.join(' · ') : '[]';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

export function ConfPill({ c }: { c: Confidence }) {
  return <span className={`ml-1 shrink-0 rounded border px-1 text-[11px] ${conf[c]}`}>{c} {confNum[c]}</span>;
}

function Value({ k, v, onSource, depth }: { k: string; v: unknown; onSource?: (q: string) => void; depth: number }) {
  if (isField(v)) {
    return (
      <div className="border-b border-dev-line/60 py-1 last:border-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-dev-dim">{words(k)}:</span>
          <span className="break-words text-dev-text">{show(v.value)}</span>
          <ConfPill c={v.confidence} />
        </div>
        {v.source && (
          <button type="button" onClick={() => onSource?.(v.source!)} className="mt-0.5 block text-left text-dev-amber underline decoration-dotted underline-offset-2 hover:text-white">
            src: “{v.source}”
          </button>
        )}
        {v.note && <div className="text-dev-dim">// {v.note}</div>}
      </div>
    );
  }
  if (Array.isArray(v)) {
    return (
      <div className="py-1">
        <div className="text-dev-dim">{words(k)}: [{v.length}]</div>
        <div className="ml-3 border-l border-dev-line pl-2">
          {v.map((row, i) => (
            <div key={i} className="py-0.5">
              {isField(row) ? <Value k={`${i}`} v={row} onSource={onSource} depth={depth + 1} /> : <Group obj={row as Record<string, unknown>} onSource={onSource} depth={depth + 1} title={`#${i + 1}`} />}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (v && typeof v === 'object') return <Group obj={v as Record<string, unknown>} onSource={onSource} depth={depth + 1} title={words(k)} />;
  return null;
}

function Group({ obj, onSource, depth, title }: { obj: Record<string, unknown>; onSource?: (q: string) => void; depth: number; title?: string }) {
  return (
    <div className={depth > 0 ? 'py-0.5' : ''}>
      {title && <div className="text-dev-dim">{title} {'{'}</div>}
      <div className={title ? 'ml-3 border-l border-dev-line pl-2' : ''}>
        {Object.entries(obj).map(([k, v]) => (
          <Value key={k} k={k} v={v} onSource={onSource} depth={depth} />
        ))}
      </div>
      {title && <div className="text-dev-dim">{'}'}</div>}
    </div>
  );
}

const statusCls = { confirmed: 'bg-dev-cyan/15 text-dev-cyan', proposed: 'bg-dev-amber/15 text-dev-amber', draft: 'bg-dev-red/15 text-dev-red' };

export function FormView({ form, onSource }: { form: FilledForm; onSource?: (q: string) => void }) {
  return (
    <details className="rounded-lg border border-dev-line bg-dev-panel" open>
      <summary className="flex min-h-[40px] cursor-pointer items-center gap-2 px-3 py-1.5">
        <span className="font-semibold text-white">{FORM_LABELS[form.type]}</span>
        <span className="text-dev-dim">form:{form.type}</span>
        <span className={`ml-auto rounded px-1.5 text-[11px] uppercase ${statusCls[form.status]}`}>{form.status}</span>
      </summary>
      <div className="px-3 pb-2">
        <Group obj={form.data as unknown as Record<string, unknown>} onSource={onSource} depth={0} />
      </div>
    </details>
  );
}
