import { useState, type ReactNode } from 'react';
import type { Do, FilledForm, Initiative, Mapping, PlanAction, Planning } from '../types';
import { FormView, ConfPill } from './FormView';
import { highlight } from '../lib/highlight';
import { hi, lo } from '../lib/field';

export function DevPanel({ title, children, fid }: { title: string; children: ReactNode; fid?: string }) {
  return (
    <section className="dev-panel mt-4" aria-label={`Under the floor: ${title}`} data-feedback-id={fid}>
      <div className="mb-2 flex items-center gap-2 border-b border-dev-line pb-1.5">
        <span className="rounded bg-dev-amber px-1.5 text-[11px] font-bold uppercase tracking-wide text-dev-bg">under the floor</span>
        <span className="truncate text-dev-dim">{title}</span>
      </div>
      {children}
    </section>
  );
}

function actionLine(a: PlanAction): string {
  switch (a.kind) {
    case 'addDo': return `INSERT do {code:${a.do.code}, text:"${a.do.text}", date:${a.do.date}}`;
    case 'markDoDone': return `UPDATE do ${a.doId} SET done=true`;
    case 'checkIn': return `UPDATE waymark ${a.waymarkId} SET checkIn.reached=${a.checkIn.reached}, coreKept=${a.checkIn.coreKept}`;
    case 'addInitiative': return `INSERT initiative I${a.initiative.number} "${a.initiative.name}" (+${a.waymarks.length} waymarks, +${a.dos.length} dos)`;
    case 'addSeed': return `INSERT seed_vault "${a.seed.text}"`;
    case 'core': return `UPSERT core_log ${a.date}.${a.key}=${a.kept}`;
  }
}

/** Everything the agent did with one entry: pipeline, classification, forms with sources, notes. */
export function EntryMachinery({ mapping, rawText, title, mode, transcriptSource, preview }: { mapping: Mapping; rawText: string; title: string; mode?: string; transcriptSource?: string; preview?: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  const m = mapping;
  return (
    <DevPanel title={title} fid="underfloor-entry">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {['capture', 'normalize', 'save raw', 'classify', 'extract', 'confirm', 'store'].map((s, i) => (
            <span key={s} className={`rounded border px-1.5 text-[11px] ${preview && i >= 5 ? 'border-dev-line text-dev-dim' : 'border-dev-cyan/40 text-dev-cyan'}`}>
              {i + 1}·{s}
            </span>
          ))}
        </div>

        <div>
          <div className="text-dev-dim">
            engine: <span className="text-white">{m.engine === 'rules' ? 'rule-based fallback (SIMULATED)' : `scripted scenario "${m.scenarioId}" (SIMULATED)`}</span>
          </div>
          {mode && (
            <div className="text-dev-dim">
              capture: <span className="text-white">{mode}</span>
              {transcriptSource && <> · transcript: <span className="text-white">{transcriptSource}</span></>}
            </div>
          )}
          <div className="text-dev-dim">
            classification: <span className="text-white">{m.classification.value}</span>
            <ConfPill c={m.classification.confidence} />
            <span className="ml-2">signals: [{m.classification.signals.join(', ')}]</span>
          </div>
          <div className="text-dev-dim">
            starting point: <span className="text-white">{m.startingPoint ?? 'n/a'}</span>
          </div>
          {m.care && <div className="mt-1 text-dev-red">CARE MODE: planning set aside</div>}
        </div>

        <div>
          <div className="text-dev-dim">raw entry (immutable){src && <button type="button" className="ml-2 text-dev-amber underline" onClick={() => setSrc(null)}>clear highlight</button>}</div>
          <pre className="mt-1 max-h-52 overflow-auto whitespace-pre-wrap rounded border border-dev-line bg-black/30 p-2 font-mono text-[12.5px] text-dev-text">{highlight(rawText, src, 'bg-dev-amber text-dev-bg rounded px-0.5')}</pre>
        </div>

        <div className="space-y-2">
          <div className="text-dev-dim">forms filled: {m.forms.length}</div>
          {m.forms.map((f, i) => (
            <FormView key={i} form={f} onSource={setSrc} />
          ))}
        </div>

        <div>
          <div className="text-dev-dim">proposals → user ({m.proposals.length})</div>
          {m.proposals.length === 0 && <div className="text-dev-dim">  none</div>}
          {m.proposals.map((p) => (
            <div key={p.id} className="ml-2 border-l border-dev-line pl-2">
              <div>
                <span className={p.status === 'yes' ? 'text-dev-cyan' : p.status === 'notnow' ? 'text-dev-red' : 'text-dev-amber'}>[{p.status}]</span> “{p.question}”
              </div>
              {p.actions.map((a, i) => (
                <div key={i} className="text-dev-dim">  {actionLine(a)}</div>
              ))}
            </div>
          ))}
          {m.autoActions.length > 0 && (
            <>
              <div className="mt-1 text-dev-dim">auto-recorded (stated facts)</div>
              {m.autoActions.map((a, i) => (
                <div key={i} className="ml-2 text-dev-dim">  {actionLine(a)}</div>
              ))}
            </>
          )}
        </div>

        <div>
          <div className="text-dev-dim">internal notes</div>
          <ul className="ml-2 space-y-0.5">
            <li><span className="text-dev-dim">alignment check:</span> {m.notes.alignment}</li>
            <li><span className="text-dev-dim">journaling vs doing:</span> {m.notes.journalingVsDoing}</li>
            {m.notes.flags.map((f, i) => (
              <li key={i} className="text-dev-amber">FLAG: {f}</li>
            ))}
            {m.notes.internal.map((f, i) => (
              <li key={`i${i}`} className="text-dev-dim">// {f}</li>
            ))}
          </ul>
        </div>
      </div>
    </DevPanel>
  );
}

/* ---------- Forms derived from planning records (for Season / Today) ---------- */

export function formsForInitiative(p: Planning, ini: Initiative): FilledForm[] {
  const wms = p.waymarks.filter((w) => w.initiativeId === ini.id).sort((a, b) => a.number - b.number);
  const parent = p.initiatives.find((i) => i.id === ini.parentId);
  const out: FilledForm[] = [
    {
      type: 'makeItPlain',
      status: ini.status === 'draft' ? 'draft' : 'confirmed',
      data: {
        name: hi(ini.name),
        initiativeNumber: hi(`I${ini.number}`),
        vision: hi(ini.vision),
        youAreHere: hi(ini.youAreHere),
        finishedWhen: hi(ini.finishedWhen),
        parentInitiative: parent ? hi(`I${parent.number} · ${parent.lane}: ${parent.name}`) : lo('', undefined, 'none'),
        startOn: ini.startOn ? hi(ini.startOn) : lo(''),
        finishedBy: ini.finishedBy ? hi(ini.finishedBy) : lo('', undefined, 'may be blank'),
      },
    },
    {
      type: 'roadmap',
      status: 'confirmed',
      data: {
        initiative: hi(`I${ini.number} · ${ini.name}`),
        youAreHere: hi(ini.youAreHere),
        waymarks: wms.map((w) => (w.status === 'draft' ? lo(`W${w.number} · ${w.title}`, undefined, 'draft') : hi(`W${w.number} · ${w.title}`))),
        finished: hi(ini.finishedWhen),
      },
    },
  ];
  for (const w of wms) {
    const dos = p.dos.filter((d) => d.waymarkId === w.id);
    out.push({
      type: 'waymarksStakes',
      status: w.status === 'draft' ? 'draft' : 'confirmed',
      data: {
        waymark: hi(`W${w.number}`),
        title: hi(w.title),
        reachBy: hi(w.reachBy ?? ''),
        stake: hi(w.stake),
        dos: dos.map((d, i) => ({ sortNo: hi(d.sortNo ?? i + 1), text: hi(d.text), priority: hi(d.priority), hours: hi(d.hours ?? 0) })),
        checkIn: { reached: hi(w.checkIn.reached ?? ''), coreKept: hi(w.checkIn.coreKept === null ? '' : w.checkIn.coreKept ? 'Yes' : 'No') },
      },
    });
  }
  return out;
}

export function doForm(d: Do): FilledForm {
  return { type: 'do', status: 'confirmed', data: { text: hi(d.text), code: hi(d.code), date: hi(d.date), done: hi(d.done) } };
}

export function RecordsPanel({ title, forms, extra }: { title: string; forms: FilledForm[]; extra?: ReactNode }) {
  return (
    <DevPanel title={title}>
      <div className="space-y-2">
        <div className="text-dev-dim">source: stored records → rendered back into workbook forms</div>
        {extra}
        {forms.map((f, i) => (
          <FormView key={i} form={f} />
        ))}
      </div>
    </DevPanel>
  );
}
