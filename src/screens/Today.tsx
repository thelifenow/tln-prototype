import type { CoreKey, Do } from '../types';
import { useDemo } from '../state/demo';
import { useUi } from '../state/ui';
import { addDays, isSabbath, prettyDate, today } from '../lib/dates';
import { Toggle } from '../components/ui';
import { IconLock } from '../components/Icons';
import { DevPanel, RecordsPanel, doForm } from '../underfloor/Machinery';

const CORE: Array<{ key: CoreKey; label: string }> = [
  { key: 'rest', label: 'Rest' },
  { key: 'prayer', label: 'Prayer & Devotion' },
  { key: 'fellowship', label: 'Fellowship' },
];

function DoRow({ d, onToggle }: { d: Do; onToggle: () => void }) {
  const id = `do-${d.id}`;
  return (
    <li className="flex items-center gap-3 border-b border-line py-1 last:border-0" data-feedback-id={`do-row-${d.id}`}>
      <input id={id} type="checkbox" checked={d.done} onChange={onToggle} className="h-6 w-6 shrink-0 accent-[#2F5D50]" />
      <label htmlFor={id} className="flex min-h-[48px] flex-1 cursor-pointer items-center gap-3 py-2">
        <span className="code-badge" title={d.code === 'D' ? 'Day in the Life' : `Initiative ${d.code.split('.')[0]} · Waymark ${d.code.split('.')[1]}`}>
          {d.code}
        </span>
        <span className={`flex-1 text-base ${d.done ? 'text-muted line-through' : ''}`}>{d.text}</span>
        {d.hours ? <span className="text-xs text-muted">{d.hours < 1 ? `${Math.round(d.hours * 60)} min` : `${d.hours} h`}</span> : null}
      </label>
    </li>
  );
}

export function Today() {
  const demo = useDemo();
  const ui = useUi();
  const p = demo.planning;
  const t = today();
  const sabbath = isSabbath() || ui.sabbathPreview;

  const todays = p.dos.filter((d) => d.date === t).sort((a, b) => Number(a.done) - Number(b.done) || a.priority - b.priority);
  const carried = p.dos.filter((d) => d.date < t && !d.done);
  const upcoming = p.dos.filter((d) => d.date > t && d.date <= addDays(t, 2) && !d.done);
  const log = p.core[t] ?? {};
  const yesterday = p.core[addDays(t, -1)] ?? {};

  // One right action: Core first, then today's latest entry, then the top Do.
  const latest = demo.entries.find((e) => e.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10) && !e.mapping.care);
  let right: string;
  if (yesterday.prayer === false) right = 'Start with prayer, before anything else.';
  else if (latest) right = latest.mapping.oneRightAction.text;
  else {
    const top = todays.find((d) => !d.done);
    right = top ? top.text : 'Today’s Dos are done. Rest well.';
  }

  if (sabbath) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-semibold">Sabbath</h1>
        <p className="text-sm text-muted">{p.season.sabbath.label}</p>
        <section className="card mt-5 p-6 text-center" data-feedback-id="sabbath-card">
          <p className="font-heading text-3xl font-medium">No Do! today</p>
          <ul className="mt-6 space-y-3 text-lg">
            <li>Rest</li>
            <li>With Him</li>
            <li>With the ones I love</li>
          </ul>
        </section>
        <div className="mt-6" data-feedback-id="sabbath-preview">
          <Toggle checked={ui.sabbathPreview} onChange={ui.setSabbathPreview} label="Preview the Sabbath view" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Today</h1>
      <p className="text-sm text-muted">{prettyDate(t)} · Fashioned Day</p>

      <section className="mt-4 rounded-2xl bg-accent p-5 text-white" data-feedback-id="today-right-action" aria-label="One right action">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/85">One right action</div>
        <p className="mt-1 font-heading text-xl font-medium leading-snug">{right}</p>
      </section>

      <section className="card mt-4 px-4 pb-2 pt-3" data-feedback-id="today-dos">
        <h2 className="eyebrow">Today’s Dos</h2>
        {todays.length === 0 ? (
          <p className="py-4 text-muted">Nothing set for today yet. Write on the Slate and confirm a Do.</p>
        ) : (
          <ul>
            {todays.map((d) => (
              <DoRow key={d.id} d={d} onToggle={() => demo.toggleDo(d.id)} />
            ))}
          </ul>
        )}
        {carried.length > 0 && (
          <>
            <h3 className="eyebrow mt-3">Carried over</h3>
            <ul>
              {carried.map((d) => (
                <DoRow key={d.id} d={d} onToggle={() => demo.toggleDo(d.id)} />
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card mt-4 p-4" data-feedback-id="today-core" aria-labelledby="core-h">
        <div className="flex items-center gap-2">
          <IconLock size={18} className="text-accent" />
          <h2 id="core-h" className="eyebrow">Core · always guarded</h2>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {CORE.map((c) => {
            const kept = log[c.key];
            return (
              <li key={c.key}>
                <button
                  type="button"
                  aria-pressed={kept === true}
                  onClick={() => demo.setCore(t, c.key, kept !== true)}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-3 text-left ${kept === true ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-paper'}`}
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-xs text-muted">{kept === true ? 'Kept' : kept === false ? 'Not yet' : 'Tap when kept'}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">The Core is never cut to make room for Dos.</p>
      </section>

      {upcoming.length > 0 && (
        <section className="mt-4 px-1" data-feedback-id="today-upcoming">
          <h2 className="eyebrow">Coming up</h2>
          <ul className="mt-1 text-sm text-muted">
            {upcoming.map((d) => (
              <li key={d.id} className="flex gap-2 py-1">
                <span className="code-badge">{d.code}</span> {d.text} · {prettyDate(d.date)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6" data-feedback-id="sabbath-preview">
        <Toggle checked={ui.sabbathPreview} onChange={ui.setSabbathPreview} label="Preview the Sabbath view" />
      </div>

      {ui.underFloor && (
        <>
          <DevPanel title="today: selection rules">
            <div>date = {t} · sabbath window = Fri 18:00 → Sat 18:00 · isSabbath = {String(isSabbath())}</div>
            <div>right action rule: core miss yesterday → latest entry today → top P1 Do</div>
            <div>core_log[{t}] = {JSON.stringify(log)}</div>
            <div>dos today = {todays.length} · carried = {carried.length} · hours planned = {todays.reduce((s, d) => s + (d.hours ?? 0), 0)}</div>
          </DevPanel>
          <RecordsPanel title="Do records (form:do)" forms={todays.map(doForm)} />
        </>
      )}
    </div>
  );
}
