import { useState } from 'react';
import type { Initiative, Waymark } from '../types';
import { useDemo } from '../state/demo';
import { useUi } from '../state/ui';
import { prettyDate } from '../lib/dates';
import { Sheet, StoneIcon } from '../components/ui';
import { IconLock, IconSeed } from '../components/Icons';
import { RecordsPanel, formsForInitiative } from '../underfloor/Machinery';

const DEGREE: Record<number, string> = { 3: 'new', 2: 'maturing', 1: 'direct impact' };

function WaymarkSheet({ w, onClose }: { w: Waymark | null; onClose: () => void }) {
  const demo = useDemo();
  if (!w) return null;
  const ini = demo.planning.initiatives.find((i) => i.id === w.initiativeId);
  const dos = demo.planning.dos.filter((d) => d.waymarkId === w.id);
  const c = w.checkIn;
  return (
    <Sheet open onClose={onClose} title={`W${w.number} · ${w.title}`} fid="waymark-sheet">
      <p className="text-sm text-muted">
        I{ini?.number} · {ini?.name}
        {w.reachBy && <> · reach by {prettyDate(w.reachBy)}</>}
        {w.status === 'draft' && <> · draft</>}
      </p>
      <div className="mt-3 rounded-xl bg-accent-soft p-4">
        <div className="eyebrow text-accent-ink">Stake</div>
        <p className="mt-1 text-lg font-medium text-accent-ink">{w.stake}</p>
      </div>
      <h3 className="eyebrow mt-5">Dos</h3>
      {dos.length === 0 ? (
        <p className="mt-1 text-muted">No Dos yet.</p>
      ) : (
        <ul className="mt-1">
          {dos.map((d) => (
            <li key={d.id} className="flex items-center gap-3 border-b border-line py-1 last:border-0">
              <input id={`ws-${d.id}`} type="checkbox" checked={d.done} onChange={() => demo.toggleDo(d.id)} className="h-6 w-6 accent-[#2F5D50]" />
              <label htmlFor={`ws-${d.id}`} className="flex min-h-[44px] flex-1 items-center gap-2">
                <span className="code-badge">{d.code}</span>
                <span className={d.done ? 'text-muted line-through' : ''}>{d.text}</span>
                <span className="ml-auto text-xs text-muted">{prettyDate(d.date)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <h3 className="eyebrow mt-5">Check the map</h3>
      <dl className="mt-1 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-line bg-card p-3">
          <dt className="text-muted">Reached?</dt>
          <dd className="text-base font-medium">{c.reached ?? 'Not checked yet'}</dd>
        </div>
        <div className="rounded-lg border border-line bg-card p-3">
          <dt className="text-muted">Core kept?</dt>
          <dd className="text-base font-medium">{c.coreKept === null ? '—' : c.coreKept ? 'Yes' : 'Not this time'}</dd>
        </div>
        {c.wentWell && (
          <div className="col-span-2 rounded-lg border border-line bg-card p-3">
            <dt className="text-muted">What went well</dt>
            <dd>{c.wentWell}</dd>
          </div>
        )}
      </dl>
    </Sheet>
  );
}

function Roadmap({ ini, onOpen }: { ini: Initiative; onOpen: (w: Waymark) => void }) {
  const demo = useDemo();
  const wms = demo.planning.waymarks.filter((w) => w.initiativeId === ini.id).sort((a, b) => a.number - b.number);
  const hereIdx = wms.findIndex((w) => w.checkIn.reached !== 'Yes');
  return (
    <ol className="relative mt-4" aria-label={`Roadmap for ${ini.name}`}>
      <span className="absolute bottom-6 left-[21px] top-4 w-0.5 bg-line" aria-hidden="true" />
      {wms.map((w, i) => {
        const open = demo.planning.dos.filter((d) => d.waymarkId === w.id && !d.done).length;
        return (
          <li key={w.id} className="relative">
            {i === hereIdx && (
              <div className="ml-14 mb-1 inline-block rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">You are here</div>
            )}
            <button type="button" onClick={() => onOpen(w)} className="flex w-full items-start gap-3 rounded-xl py-2 pr-2 text-left hover:bg-paper" data-feedback-id={`waymark-${w.id}`} aria-label={`Waymark ${w.number}: ${w.title}. Stake: ${w.stake}. ${w.checkIn.reached ? `Reached: ${w.checkIn.reached}` : 'Not reached yet'}`}>
              <span className="relative z-10 shrink-0 rounded-full bg-card">
                <StoneIcon size={44} reached={w.checkIn.reached} draft={w.status === 'draft'} />
              </span>
              <span className="min-w-0 flex-1 pt-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted">W{w.number}</span>
                  <span className="font-medium">{w.title}</span>
                  {w.status === 'draft' && <span className="rounded border border-line px-1 text-[11px] text-muted">draft</span>}
                </span>
                <span className="block text-sm text-muted">Stake: {w.stake}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {w.checkIn.reached ? `Reached? ${w.checkIn.reached}` : 'Reached? Not yet'}
                  {open > 0 && ` · ${open} Do${open > 1 ? 's' : ''} open`}
                  {w.reachBy && ` · by ${prettyDate(w.reachBy)}`}
                </span>
              </span>
            </button>
          </li>
        );
      })}
      <li className="ml-14 mt-1 text-sm text-muted">Finished when: {ini.finishedWhen}</li>
    </ol>
  );
}

export function Season() {
  const demo = useDemo();
  const ui = useUi();
  const p = demo.planning;
  const [open, setOpen] = useState<Waymark | null>(null);
  const live = open ? p.waymarks.find((w) => w.id === open.id) ?? null : null;
  const inits = [...p.initiatives].sort((a, b) => a.number - b.number);

  return (
    <div>
      <section className="card p-5" data-feedback-id="season-card">
        <div className="eyebrow">Season</div>
        <h1 className="mt-1 font-heading text-2xl font-semibold">{p.season.name}</h1>
        <p className="mt-2 text-base leading-relaxed">{p.season.strategy}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1"><IconLock size={16} className="text-accent" /> Core: Rest, Prayer & Devotion, Fellowship</span>
          <span className="rounded-full border border-line px-3 py-1">Sabbath: {p.season.sabbath.label}</span>
        </div>
      </section>

      <h2 className="eyebrow mt-6">Initiatives</h2>
      <div className="mt-2 space-y-4">
        {inits.map((ini) => (
          <section key={ini.id} className="card p-5" data-feedback-id={`initiative-${ini.id}`} aria-labelledby={`h-${ini.id}`}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-accent-ink">I{ini.number}</span>
              <span className="text-sm text-muted">{ini.lane}</span>
              <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink" title="Degree">
                Degree {ini.degree} · {DEGREE[ini.degree]}
              </span>
            </div>
            <h3 id={`h-${ini.id}`} className="mt-1 font-heading text-xl font-semibold">{ini.name}</h3>
            <p className="mt-1 text-sm leading-relaxed">{ini.vision}</p>
            {ini.finishedBy && <p className="mt-1 text-xs text-muted">Finished by {prettyDate(ini.finishedBy)}</p>}
            <Roadmap ini={ini} onOpen={setOpen} />
            {ui.underFloor && <RecordsPanel title={`I${ini.number} records → forms`} forms={formsForInitiative(p, ini)} />}
          </section>
        ))}
      </div>

      <section className="card mt-6 p-5" data-feedback-id="seed-vault" aria-labelledby="seed-h">
        <div className="flex items-center gap-2">
          <IconSeed className="text-accent" />
          <h2 id="seed-h" className="font-heading text-lg font-semibold">Seed Vault</h2>
        </div>
        <p className="text-sm text-muted">Ideas kept for later, not now.</p>
        <ul className="mt-2 divide-y divide-line">
          {[...p.seeds].reverse().map((s) => (
            <li key={s.id} className="py-2">
              <div className="font-medium">{s.text}</div>
              <div className="text-sm text-muted">{s.why}</div>
            </li>
          ))}
        </ul>
      </section>

      <WaymarkSheet w={live} onClose={() => setOpen(null)} />
    </div>
  );
}
