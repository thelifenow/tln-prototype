import type { Classification, Do, FilledForm, Mapping, MapLink, PlanAction, Planning, Proposal } from '../types';
import { hi, lo, med } from '../lib/field';
import { addDays, today } from '../lib/dates';
import { uid } from '../lib/id';

/* Simple keyword rules for free-typed entries. Labelled "simulated" under the floor. */

const DISTRESS = /\b(hopeless|no point( in)?|can'?t go on|give up on (everything|life)|want to die|end it all|kill myself|worthless|no way out)\b/i;
const DONE = /\b(finished|done with|completed|did|sent|wrapped up|got through)\b/i;
const PLAN = /\b(need to|have to|must|should|going to|gonna|plan to|want to|tomorrow|todo|to-do|remember to)\b/i;
const IDEA = /\b(what if|idea|someday|some day|one day|maybe we could|dream of)\b/i;
const FEEL = /\b(feel|felt|tired|grateful|thankful|praise|thank god|angry|sad|frustrated|anxious|happy|joy|cried|lonely|worried|hurt|overwhelmed)\b/i;
const CORE_MISS: Array<{ re: RegExp; key: 'prayer' | 'rest' | 'fellowship'; label: string }> = [
  { re: /\b(skipped|missed|didn'?t)\b[^.]*\b(pray|prayer|devotion)/i, key: 'prayer', label: 'Prayer & Devotion' },
  { re: /\b(no sleep|didn'?t sleep|skipped rest|no rest|exhausted)\b/i, key: 'rest', label: 'Rest' },
  { re: /\b(skipped|missed)\b[^.]*\b(church|small group|dinner with|time with)/i, key: 'fellowship', label: 'Fellowship' },
];

const STOP = new Set('the a an and or to of in on for at it is was my i me we with this that be up out off one'.split(' '));
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?\n])\s+/).map((s) => s.trim()).filter(Boolean);
}

function cleanTask(s: string): string {
  let t = s.replace(/^(i|we)\s+(really\s+)?(need to|have to|must|should|am going to|'m going to|want to|plan to|gonna)\s+/i, '');
  t = t.replace(/^(remember to|tomorrow,?\s*(i\s+)?(need to|will)?\s*)/i, '');
  t = t.replace(/[.!?]+$/, '').replace(/\s+(today|tomorrow|tonight|this (morning|afternoon|evening))$/i, '').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function bestDoMatch(p: Planning, sentence: string): Do | undefined {
  const sw = new Set(words(sentence));
  let best: { d: Do; score: number } | undefined;
  for (const d of p.dos) {
    if (d.done) continue;
    const dw = words(d.text);
    const score = dw.filter((w) => sw.has(w)).length / Math.max(dw.length, 1);
    if (score > 0.34 && (!best || score > best.score)) best = { d, score };
  }
  return best?.d;
}

function initiativeFor(p: Planning, sentence: string): { code: Do['code']; waymarkId?: string; initiativeId?: string; why: string } {
  const s = sentence.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/\b(house|garage|closet|clean|clear|declutter|room|desk|office|kitchen)\b/, 'i1'],
    [/\b(book|planner|journal|app|tln|printer|chapter|cover|print)\b/, 'i2'],
    [/\b(tmks|master'?s key|week \d+ notes)\b/, 'i3'],
  ];
  for (const [re, iid] of rules) {
    if (re.test(s)) {
      const ini = p.initiatives.find((i) => i.id === iid && i.status === 'active');
      const wm = p.waymarks.filter((w) => w.initiativeId === iid && w.checkIn.reached !== 'Yes').sort((a, b) => a.number - b.number)[0];
      if (ini && wm) return { code: `${ini.number}.${wm.number}` as Do['code'], waymarkId: wm.id, initiativeId: ini.id, why: `Keyword match → I${ini.number} · W${wm.number}` };
    }
  }
  return { code: 'D', why: 'No initiative keyword → Day in the Life' };
}

export function ruleBasedMapping(text: string, p: Planning, entryId: string): Mapping {
  const t = today();
  const notes = { alignment: '', journalingVsDoing: '', flags: [] as string[], internal: ['Engine: rule-based fallback (simulated). Keywords only; no AI.'] };

  /* ---------- Care first: serious distress sets planning aside ---------- */
  const distress = text.match(DISTRESS);
  if (distress) {
    return {
      engine: 'rules',
      classification: { value: 'journal', confidence: 'high', signals: [`distress: "${distress[0]}"`] },
      heard: 'You are carrying something very heavy right now.',
      oneRightAction: {
        text: 'Please reach out to someone today: a person you trust, or call or text 988 (in the US) to talk with someone now. You do not have to carry this alone.',
        source: distress[0],
      },
      forms: [{ type: 'journalEntry', status: 'confirmed', data: { rawText: hi(text), mood: med('in distress', distress[0]) } }],
      proposals: [],
      autoActions: [],
      autoSummary: [],
      links: [],
      care: true,
      notes: {
        alignment: 'Planning set aside.',
        journalingVsDoing: 'Not applicable: care response only.',
        flags: ['DISTRESS: no planning prompts, no Dos, no questions. Care response shown.'],
        internal: notes.internal,
      },
    };
  }

  const ss = sentences(text);
  const forms: FilledForm[] = [];
  const proposals: Proposal[] = [];
  const autoActions: PlanAction[] = [];
  const autoSummary: string[] = [];
  const links: MapLink[] = [];
  const signals: string[] = [];
  let right: Mapping['oneRightAction'] | undefined;

  const feel = text.match(FEEL);
  if (feel) signals.push(`feeling: "${feel[0]}"`);

  // Done → mark an existing Do done (proposed, since the match is fuzzy).
  for (const s of ss) {
    if (!DONE.test(s)) continue;
    const m = bestDoMatch(p, s);
    if (m) {
      signals.push('done');
      forms.push({ type: 'do', status: 'proposed', data: { text: med(m.text, s, 'Fuzzy word match to an open Do.'), code: hi(m.code), date: hi(m.date), done: med(true, s.match(DONE)?.[0]) } });
      proposals.push({ id: uid('pr'), question: `Mark "${m.text}" done?`, actions: [{ kind: 'markDoDone', doId: m.id }], confirmsForms: [forms.length - 1], status: 'pending' });
      links.push({ label: `→ Do ${m.code} done`, source: s });
      break;
    }
  }

  // Core misses → gentle right action.
  for (const c of CORE_MISS) {
    const m = text.match(c.re);
    if (m) {
      autoActions.push({ kind: 'core', date: t, key: c.key, kept: false });
      notes.flags.push(`Core: ${c.label} missed. Raise gently, no lecture.`);
      links.push({ label: `→ Core: ${c.label}`, source: m[0] });
      right = { text: c.key === 'prayer' ? 'Tomorrow, start with prayer, before anything else.' : c.key === 'rest' ? 'Rest tonight. The Dos can wait.' : 'Reach out to someone you love today.', source: m[0] };
    }
  }

  // Plan → new Do.
  for (const s of ss) {
    if (!PLAN.test(s) || DONE.test(s) || IDEA.test(s)) continue;
    const task = cleanTask(s);
    if (task.length < 4) continue;
    const where = initiativeFor(p, s);
    const tomorrow = /\btomorrow\b/i.test(s);
    const d: Do = { id: uid('do'), text: task, code: where.code, date: tomorrow ? addDays(t, 1) : t, done: false, waymarkId: where.waymarkId, initiativeId: where.initiativeId, priority: 2, hours: 0.5, sourceEntryId: entryId };
    signals.push('plan');
    forms.push({ type: 'do', status: 'proposed', data: { text: med(task, s), code: (where.code === 'D' ? med : lo)(where.code, undefined, where.why), date: (tomorrow ? hi : lo)(d.date, tomorrow ? 'tomorrow' : undefined), done: hi(false) } });
    proposals.push({ id: uid('pr'), question: `Add "${task}" as a Do for ${tomorrow ? 'tomorrow' : 'today'}?`, actions: [{ kind: 'addDo', do: d }], confirmsForms: [forms.length - 1], status: 'pending' });
    links.push({ label: `→ Do ${where.code}`, source: s });
    right ??= { text: `${task}.`, source: s };
    break;
  }

  // Idea → Seed Vault.
  for (const s of ss) {
    if (!IDEA.test(s)) continue;
    signals.push('idea');
    const idea = s.replace(/[.!?]+$/, '');
    proposals.push({ id: uid('pr'), question: 'Save this idea to the Seed Vault for later?', actions: [{ kind: 'addSeed', seed: { id: uid('seed'), text: idea, why: 'Saved from your Slate.', savedOn: t, sourceEntryId: entryId } }], confirmsForms: [], status: 'pending' });
    links.push({ label: '→ Seed Vault', source: s });
    break;
  }

  const planning = proposals.length > 0 || autoActions.length > 0;
  const value: Classification = planning ? (feel ? 'both' : 'planning') : 'journal';

  forms.unshift({ type: 'journalEntry', status: 'confirmed', data: { rawText: hi(text), ...(feel ? { mood: lo(feel[0], feel[0], 'Single keyword; low confidence.') } : {}) } });
  // forms indexes shifted by one
  proposals.forEach((pr) => (pr.confirmsForms = pr.confirmsForms.map((i) => i + 1)));

  notes.alignment = planning ? 'Matched by keywords only; check codes before trusting.' : 'No planning keywords found.';
  notes.journalingVsDoing = value === 'journal' ? 'Journaling.' : value === 'both' ? 'Both: feelings plus a step.' : 'Doing.';
  if (!planning && !feel) notes.flags.push('Low signal: nothing matched. Kept as a journal entry.');

  const first = ss[0] ?? text;
  const doneUnmatched = !planning && ss.some((s) => DONE.test(s));
  if (doneUnmatched) {
    signals.push('done (no matching Do)');
    notes.flags.push('Past-tense "done" language, but no open Do matched. Kept as a journal entry.');
  }
  return {
    engine: 'rules',
    classification: { value, confidence: planning ? 'medium' : 'low', signals },
    heard: doneUnmatched ? 'You got it done. It’s written down.' : value === 'journal' ? 'Thank you for writing it down. It’s kept just as you wrote it.' : `I heard: "${first.length > 90 ? first.slice(0, 88) + '…' : first}"`,
    oneRightAction: right ?? { text: value === 'journal' ? 'Nothing more is needed right now.' : 'Pick the next Do on Today and start it.' },
    forms,
    proposals: proposals.slice(0, 2),
    autoActions,
    autoSummary,
    links,
    notes,
  };
}
