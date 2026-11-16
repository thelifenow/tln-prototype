import type { Entry, Mapping, PlanAction, Planning } from '../types';
import { matchScenario } from '../data/scenarios';
import { ruleBasedMapping } from './fallback';

export function applyActions(p: Planning, actions: PlanAction[]): Planning {
  let next = p;
  for (const a of actions) {
    switch (a.kind) {
      case 'addDo':
        if (!next.dos.some((d) => d.id === a.do.id)) next = { ...next, dos: [...next.dos, a.do] };
        break;
      case 'markDoDone':
        next = { ...next, dos: next.dos.map((d) => (d.id === a.doId ? { ...d, done: true } : d)) };
        break;
      case 'checkIn':
        next = { ...next, waymarks: next.waymarks.map((w) => (w.id === a.waymarkId ? { ...w, checkIn: { ...w.checkIn, ...a.checkIn } } : w)) };
        break;
      case 'addInitiative':
        if (next.initiatives.some((i) => i.id === a.initiative.id)) break;
        next = {
          ...next,
          initiatives: [...next.initiatives, a.initiative],
          waymarks: [...next.waymarks, ...a.waymarks],
          dos: [...next.dos, ...a.dos],
          nextInitiativeNumber: Math.max(next.nextInitiativeNumber, a.initiative.number + 1),
        };
        break;
      case 'addSeed':
        if (!next.seeds.some((s) => s.id === a.seed.id)) next = { ...next, seeds: [...next.seeds, a.seed] };
        break;
      case 'core':
        next = { ...next, core: { ...next.core, [a.date]: { ...next.core[a.date], [a.key]: a.kept } } };
        break;
    }
  }
  return next;
}

/** Steps 4–5 of the pipeline: classify and extract into forms. */
export function mapEntry(text: string, p: Planning, entryId: string, forceScenarioId?: string): Mapping {
  const sc = forceScenarioId ? undefined : matchScenario(text);
  if (sc) return sc.build(p, entryId);
  return ruleBasedMapping(text, p, entryId);
}

export function answerProposal(entry: Entry, proposalId: string, yes: boolean): Entry {
  const m = entry.mapping;
  const pr = m.proposals.find((x) => x.id === proposalId);
  if (!pr) return entry;
  const forms = m.forms.map((f, i) =>
    pr.confirmsForms.includes(i) ? ({ ...f, status: yes ? 'confirmed' : 'draft' } as typeof f) : f,
  );
  return {
    ...entry,
    mapping: { ...m, forms, proposals: m.proposals.map((x) => (x.id === proposalId ? { ...x, status: yes ? 'yes' : 'notnow' } : x)) },
  };
}
