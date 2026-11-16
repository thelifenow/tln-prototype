import type { CaptureMode, CostRow, Do, FilledForm, Mapping, Planning, Waymark } from '../types';
import { hi, lo, med } from '../lib/field';
import { addDays, monthDay, nextMonthDay, today } from '../lib/dates';
import { uid } from '../lib/id';
import { HANDWRITING_LINES } from './handwriting';

export interface Scenario {
  id: string;
  chip: string;
  mode: CaptureMode;
  text: string;
  lookFor: string;
  build: (p: Planning, entryId: string) => Mapping;
}

const findDo = (p: Planning, id: string) => p.dos.find((d) => d.id === id);
const wmTitle = (p: Planning, id: string) => p.waymarks.find((w) => w.id === id)?.title ?? '';

/* ------------------------------ 1 · Lost ------------------------------ */
const LOST =
  "I don't know what I want. I just know something has to change. The house is a wreck and I can't think. Every time I sit down to pray or plan, I'm looking at piles. I'm tired of feeling stuck.";

/* --------------------------- 2 · Clear vision -------------------------- */
const VISION =
  "I know I'm called to finish the book. The Life NOW has eleven chapters drafted out of fourteen, and I want it finished by March 1. I'll know it's done when the whole manuscript is in my editor's hands. Right now the last three chapters are only notes. It's going to take finishing chapters 12, 13 and 14, rewriting the introduction, asking three friends to read it, and booking the editor. Someday I'd love an audiobook too, but not yet.";

/* ----------------------------- 3 · Progress ---------------------------- */
const PROGRESS = 'Finished the cover page and sent it to print. Skipped prayer this morning.';

/* --------------------------- 4 · Journal only -------------------------- */
const JOURNAL =
  "Praise God, Mom's scan came back clear. I cried in the car. But work was brutal today: my manager moved the deadline again and I snapped at the kids at dinner. I'm so tired of feeling behind. I sense Him saying slow down, I'm still here. Why do I keep carrying everything alone?";

/* ------------------------- 5 · Handwriting photo ----------------------- */
const PHOTO = HANDWRITING_LINES.join('\n');

/* ----------------------------- 6 · Voice note -------------------------- */
const VOICE =
  "Okay, quick idea while I'm driving. What if we started a TLN circle, like six people meeting at the house every other Tuesday night, walking through the planner together? I could write a little guide for it. I don't know, I just got really excited about it.";

const cost = (toBuild: string, toKeep: string, iHave: string, shortBy: string, conf: 'm' | 'l' = 'm'): CostRow => {
  const g = conf === 'm' ? med : lo;
  return { toBuild: g(toBuild), toKeep: g(toKeep), iHave: g(iHave), shortBy: g(shortBy) };
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'lost',
    chip: 'Lost',
    mode: 'typed',
    text: LOST,
    lookFor:
      'Starting point = Seeking Direction. Proposes Set Your House in Order and one small action (clear one surface). It must not ask for a vision.',
    build: (_p, entryId) => {
      const t = today();
      const doItem: Do = {
        id: uid('do'),
        text: 'Clear one surface: the kitchen table',
        code: 'D',
        date: t,
        done: false,
        initiativeId: 'i1',
        priority: 1,
        hours: 0.25,
        sourceEntryId: entryId,
      };
      const forms: FilledForm[] = [
        {
          type: 'startingPoint',
          status: 'confirmed',
          data: {
            kind: hi('Seeking Direction', "I don't know what I want", 'No vision stated; asks for change, not a goal.'),
            leadsTo: hi('Set Your House in Order', 'The house is a wreck and I can\'t think'),
            signals: med(['no stated goal', 'environment blocking thought', 'stuck'], "I'm tired of feeling stuck"),
          },
        },
        {
          type: 'journalEntry',
          status: 'confirmed',
          data: {
            rawText: hi(LOST),
            mood: med('overwhelmed, stuck', "I'm tired of feeling stuck"),
            vent: hi('The house is a wreck and I can\'t think.', "The house is a wreck and I can't think"),
            questions: lo([] as string[], undefined, 'No direct question asked.'),
          },
        },
        {
          type: 'do',
          status: 'proposed',
          data: {
            text: med('Clear one surface: the kitchen table', "I'm looking at piles", 'Smallest physical step; table chosen as default surface.'),
            code: hi('D', undefined, 'Day in the Life: not yet tied to a waymark.'),
            date: hi(t),
            done: hi(false),
          },
        },
      ];
      return {
        engine: 'scripted',
        scenarioId: 'lost',
        classification: { value: 'both', confidence: 'medium', signals: ['feeling language', 'environment', 'no goal'] },
        startingPoint: 'Seeking Direction',
        heard: 'You feel stuck, and the mess at home is making it hard to think.',
        oneRightAction: { text: 'Clear one surface today. Just one.', source: "I'm looking at piles" },
        forms,
        proposals: [
          {
            id: uid('pr'),
            question: 'Start with Set Your House in Order, and make clearing the kitchen table today’s Do?',
            actions: [{ kind: 'addDo', do: doItem }],
            confirmsForms: [2],
            status: 'pending',
          },
        ],
        autoActions: [],
        autoSummary: [],
        links: [
          { label: '→ Starting point: Seeking Direction', source: "I don't know what I want" },
          { label: '→ Do: clear one surface', source: "I'm looking at piles" },
        ],
        notes: {
          alignment: 'Maps to I1 · Set Your House in Order (Mess lane). Season fit: strong.',
          journalingVsDoing: 'Mostly journaling. One tiny Do only; do not stack more.',
          flags: ['Vision prompt suppressed: Seeking Direction must not be pushed to name a vision.'],
          internal: ['Starting point rule: lost → Set Your House in Order.', 'Response length capped at 2 lines.'],
        },
      };
    },
  },

  {
    id: 'vision',
    chip: 'Clear vision',
    mode: 'typed',
    text: VISION,
    lookFor:
      'Make It Plain drafted (vision, you are here, finished when, finished by March 1; "I\'ll start on" left as a low-confidence draft). Dump. Sort. started with the audiobook in the Seed Vault (V). Asks to confirm a new initiative.',
    build: (p, entryId) => {
      const n = p.nextInitiativeNumber;
      const iid = uid('i');
      const by = nextMonthDay(3, 1);
      const t = today();
      const wid = (k: number) => `${iid}-w${k}`;
      const waymarks: Waymark[] = [
        { id: wid(1), initiativeId: iid, number: 1, title: 'Last three chapters drafted', stake: 'Chapters 12, 13 and 14 are written start to finish', reachBy: addDays(t, 35), status: 'active', checkIn: { reached: null, coreKept: null } },
        { id: wid(2), initiativeId: iid, number: 2, title: 'Introduction rewritten', stake: 'A new introduction I am not embarrassed by', reachBy: addDays(t, 55), status: 'draft', checkIn: { reached: null, coreKept: null } },
        { id: wid(3), initiativeId: iid, number: 3, title: 'Read by three friends', stake: 'Three friends have read it and told me the truth', reachBy: addDays(t, 85), status: 'draft', checkIn: { reached: null, coreKept: null } },
        { id: wid(4), initiativeId: iid, number: 4, title: 'With the editor', stake: 'The whole manuscript is in my editor’s hands', reachBy: by, status: 'draft', checkIn: { reached: null, coreKept: null } },
      ];
      const code = `${n}.1` as Do['code'];
      const dos: Do[] = [
        { id: uid('do'), text: 'Write the first page of chapter 12', code, date: addDays(t, 1), done: false, waymarkId: wid(1), initiativeId: iid, sortNo: 1, priority: 1, hours: 1, sourceEntryId: entryId },
      ];
      const forms: FilledForm[] = [
        {
          type: 'makeItPlain',
          status: 'proposed',
          data: {
            name: med('Finish the book', 'finish the book'),
            initiativeNumber: hi(`I${n}`, undefined, 'Next unused initiative number.'),
            vision: med('Finish The Life NOW book: all fourteen chapters, ready for the editor.', "I know I'm called to finish the book"),
            youAreHere: hi('Eleven of fourteen chapters drafted; the last three are only notes.', 'eleven chapters drafted out of fourteen'),
            finishedWhen: hi('The whole manuscript is in my editor’s hands.', "the whole manuscript is in my editor's hands"),
            parentInitiative: med('I2 · Prepare: Building TLN', 'The Life NOW', 'The book is one of the four TLN pieces.'),
            startOn: lo('', undefined, 'Not stated. Left blank as a draft; never assume a start date.'),
            finishedBy: hi(by, 'finished by March 1'),
          },
        },
        {
          type: 'dumpSort',
          status: 'proposed',
          data: {
            items: [
              { text: hi('Finish chapter 12', 'finishing chapters 12, 13 and 14'), sortNo: med<number | 'V'>(1) },
              { text: hi('Finish chapter 13', 'finishing chapters 12, 13 and 14'), sortNo: med<number | 'V'>(2) },
              { text: hi('Finish chapter 14', 'finishing chapters 12, 13 and 14'), sortNo: med<number | 'V'>(3) },
              { text: hi('Rewrite the introduction', 'rewriting the introduction'), sortNo: med<number | 'V'>(4) },
              { text: hi('Ask three friends to read it', 'asking three friends to read it'), sortNo: med<number | 'V'>(5) },
              { text: hi('Book the editor', 'booking the editor'), sortNo: lo<number | 'V'>(6, undefined, 'Booking may need to happen earlier; ask at Check the map.') },
              { text: hi('Audiobook', "Someday I'd love an audiobook too, but not yet"), sortNo: hi<number | 'V'>('V', 'but not yet') },
            ],
          },
        },
        {
          type: 'roadmap',
          status: 'proposed',
          data: {
            initiative: hi(`I${n} · Finish the book`),
            youAreHere: hi('Eleven of fourteen chapters drafted', 'eleven chapters drafted out of fourteen'),
            waymarks: waymarks.map((w, i) => (i === 0 ? med(`W1 · ${w.title}`, 'the last three chapters are only notes') : lo(`W${w.number} · ${w.title}`, undefined, 'Ordered from Dump. Sort.; draft.'))),
            finished: hi('Manuscript with the editor', "the whole manuscript is in my editor's hands"),
          },
        },
        {
          type: 'waymarksStakes',
          status: 'draft',
          data: {
            waymark: hi('W1'),
            title: med('Last three chapters drafted', 'the last three chapters are only notes'),
            reachBy: lo(addDays(t, 35), undefined, 'Back-planned from March 1; not stated.'),
            stake: med('Chapters 12, 13 and 14 are written start to finish', 'finishing chapters 12, 13 and 14'),
            dos: [
              { sortNo: hi(1), text: med('Write the first page of chapter 12'), priority: med<1 | 2 | 3>(1), hours: lo(1) },
              { sortNo: hi(2), text: med('Draft chapter 13'), priority: med<1 | 2 | 3>(1), hours: lo(6) },
              { sortNo: hi(3), text: med('Draft chapter 14'), priority: med<1 | 2 | 3>(1), hours: lo(6) },
            ],
            checkIn: { reached: lo<'' | 'Yes' | 'Partly' | 'Not yet'>(''), coreKept: lo<'' | 'Yes' | 'No'>('') },
          },
        },
        {
          type: 'countTheCost',
          status: 'draft',
          data: {
            time: cost('about 15 hours of writing', 'none after March 1', 'not stated', 'unknown', 'l'),
            relationships: cost('three readers', 'none', 'three friends named', '0', 'l'),
            financial: cost('editor fee', 'none', 'not stated', 'unknown', 'l'),
            strength: cost('steady mornings', 'none', 'not stated', 'unknown', 'l'),
            canIBuild: lo('Not sure'),
            canIKeep: lo('Yes'),
            ifNot: lo(''),
            imIn: lo('', undefined, 'Wait for the user. Never assume "I\'m in".'),
            firstDoDate: med(addDays(t, 1)),
            coreGuarded: hi('Rest, Prayer & Devotion, Fellowship'),
          },
        },
      ];
      return {
        engine: 'scripted',
        scenarioId: 'vision',
        classification: { value: 'planning', confidence: 'high', signals: ['called to', 'deadline', 'finish line', 'list of steps'] },
        startingPoint: 'Seeking Clarity',
        heard: `You are called to finish the book, eleven of fourteen chapters in, by ${monthDay(by)}.`,
        oneRightAction: { text: 'Write the first page of chapter 12.', source: 'finishing chapters 12, 13 and 14' },
        forms,
        proposals: [
          {
            id: uid('pr'),
            question: `Start a new initiative called "Finish the book", finished by ${monthDay(by)}?`,
            actions: [{ kind: 'addInitiative', initiative: { id: iid, number: n, lane: 'Prepare', name: 'Finish the book', degree: 3, status: 'active', vision: 'Finish The Life NOW book: all fourteen chapters, ready for the editor.', youAreHere: 'Eleven of fourteen chapters drafted; the last three are only notes.', finishedWhen: 'The whole manuscript is in my editor’s hands.', parentId: 'i2', finishedBy: by, sourceEntryId: entryId }, waymarks, dos }],
            confirmsForms: [0, 1, 2],
            status: 'pending',
          },
          {
            id: uid('pr'),
            question: 'Save the audiobook to the Seed Vault for later?',
            actions: [{ kind: 'addSeed', seed: { id: uid('seed'), text: 'An audiobook of The Life NOW', why: 'You said "not yet".', savedOn: today(), sourceEntryId: entryId } }],
            confirmsForms: [],
            status: 'pending',
          },
        ],
        autoActions: [],
        autoSummary: [],
        links: [
          { label: `→ Make It Plain: I${n}`, source: "I know I'm called to finish the book" },
          { label: '→ Dump. Sort. (7 items)', source: 'finishing chapters 12, 13 and 14' },
          { label: '→ Seed Vault: audiobook', source: "Someday I'd love an audiobook too, but not yet" },
          { label: '→ new waymark draft', source: 'the last three chapters are only notes' },
        ],
        notes: {
          alignment: 'Fits the season: the book is part of I2 · Building TLN. Parent link proposed.',
          journalingVsDoing: 'Planning-heavy. Vision is clear; do not re-ask for it.',
          flags: [
            `Degree 3 load after confirm: ${p.initiatives.filter((i) => i.degree === 3 && i.status === 'active').length + 1} of 3.`,
            'Start date not stated: kept as draft.',
            'Count the Cost incomplete: draft only, ask before committing.',
          ],
          internal: ['Starting point inferred as Seeking Clarity → Make It Plain.', 'Waymarks back-planned from finish date.'],
        },
      };
    },
  },

  {
    id: 'progress',
    chip: 'Progress',
    mode: 'typed',
    text: PROGRESS,
    lookFor:
      'Marks Do 2.2 (cover page) done, proposes a Partly check-in on "Planner ready to print", and raises the missed prayer gently as tomorrow’s right action (no lecture).',
    build: (p) => {
      const cover = findDo(p, 'do-cover');
      const wmId = cover?.waymarkId ?? 'w2-2';
      const title = wmTitle(p, wmId) || 'Planner ready to print';
      const t = today();
      const forms: FilledForm[] = [
        {
          type: 'do',
          status: 'confirmed',
          data: {
            text: hi(cover?.text ?? 'Finish the cover page and send it to print', 'Finished the cover page and sent it to print'),
            code: hi(cover?.code ?? '2.2'),
            date: hi(cover?.date ?? t),
            done: hi(true, 'Finished'),
          },
        },
        {
          type: 'checkTheMap',
          status: 'proposed',
          data: {
            waymark: hi(`W2 · ${title}`),
            didIReachIt: med('Partly', 'sent it to print', 'One Do left on this waymark (proof the Count the Cost page).'),
            wentWell: hi('Finished the cover page and sent it to print.', 'Finished the cover page and sent it to print'),
            inTheWay: lo('', undefined, 'Not stated.'),
            coreKept: hi('No', 'Skipped prayer this morning'),
            next: lo('on to the next waymark', undefined, 'Hold until the proof is done.'),
          },
        },
        {
          type: 'waymarksStakes',
          status: 'proposed',
          data: {
            waymark: hi('W2'),
            title: hi(title),
            reachBy: hi(p.waymarks.find((w) => w.id === wmId)?.reachBy ?? ''),
            stake: hi('The final files are with the printer', 'sent it to print'),
            dos: [
              { sortNo: hi(1), text: hi('Finish the cover page and send it to print', 'Finished the cover page'), priority: hi<1 | 2 | 3>(1), hours: hi(2) },
              { sortNo: hi(2), text: hi('Proof the Count the Cost page'), priority: hi<1 | 2 | 3>(2), hours: hi(1) },
            ],
            checkIn: { reached: med<'' | 'Yes' | 'Partly' | 'Not yet'>('Partly'), coreKept: hi<'' | 'Yes' | 'No'>('No', 'Skipped prayer this morning') },
          },
        },
        {
          type: 'journalEntry',
          status: 'confirmed',
          data: { rawText: hi(PROGRESS), testify: lo('Cover sent to print', 'sent it to print') },
        },
      ];
      return {
        engine: 'scripted',
        scenarioId: 'progress',
        classification: { value: 'planning', confidence: 'high', signals: ['finished', 'skipped (Core)'] },
        heard: 'The cover is finished and at the printer. Prayer got skipped this morning.',
        oneRightAction: { text: 'Tomorrow, start with prayer, before anything else.', source: 'Skipped prayer this morning' },
        forms,
        proposals: [
          {
            id: uid('pr'),
            question: `Check in on "${title}" as partly reached?`,
            actions: [{ kind: 'checkIn', waymarkId: wmId, checkIn: { reached: 'Partly', coreKept: false, wentWell: 'Finished the cover page and sent it to print.', on: t } }],
            confirmsForms: [1, 2],
            status: 'pending',
          },
        ],
        autoActions: [
          ...(cover ? [{ kind: 'markDoDone' as const, doId: cover.id }] : []),
          { kind: 'core', date: t, key: 'prayer', kept: false },
        ],
        autoSummary: [cover ? `Marked done: ${cover.text} (${cover.code})` : 'Noted: cover page finished'],
        links: [
          { label: `→ Do ${cover?.code ?? '2.2'} done`, source: 'Finished the cover page and sent it to print' },
          { label: '→ Check the map: Partly', source: 'sent it to print' },
          { label: '→ Core: prayer', source: 'Skipped prayer this morning' },
        ],
        notes: {
          alignment: 'I2 · W2 progress. Stake ("final files with the printer") nearly true.',
          journalingVsDoing: 'Doing signal strong. Short entry; keep the reply short.',
          flags: ['Core: Prayer & Devotion missed today. Raise gently as tomorrow’s right action. No lecture, no streak talk.'],
          internal: ['Fact stated in past tense → recorded directly (auto), check-in proposed.'],
        },
      };
    },
  },

  {
    id: 'journal',
    chip: 'Journal only',
    mode: 'typed',
    text: JOURNAL,
    lookFor: 'Journal only: praise, vent, what I sense He’s saying, and a question are filled. Nothing goes to planning. A warm one-line reply.',
    build: () => ({
      engine: 'scripted',
      scenarioId: 'journal',
      classification: { value: 'journal', confidence: 'high', signals: ['praise', 'vent', 'no tasks', 'question to God'] },
      heard: "Mom's scan came back clear, and the day was still hard.",
      oneRightAction: { text: 'Rest tonight. Nothing else is needed from you.' },
      forms: [
        {
          type: 'journalEntry',
          status: 'confirmed',
          data: {
            rawText: hi(JOURNAL),
            mood: med('grateful and worn out', "I'm so tired of feeling behind"),
            praise: hi("Mom's scan came back clear.", "Praise God, Mom's scan came back clear"),
            testify: med('I cried in the car.', 'I cried in the car'),
            vent: hi('My manager moved the deadline again and I snapped at the kids at dinner.', 'my manager moved the deadline again and I snapped at the kids at dinner'),
            sensingHeSays: hi('Slow down, I’m still here.', "slow down, I'm still here"),
            questions: hi(['Why do I keep carrying everything alone?'], 'Why do I keep carrying everything alone?'),
          },
        },
      ],
      proposals: [],
      autoActions: [],
      autoSummary: [],
      links: [
        { label: '→ Praise', source: "Praise God, Mom's scan came back clear" },
        { label: '→ What I sense He’s saying', source: "slow down, I'm still here" },
      ],
      notes: {
        alignment: 'No planning content. Nothing mapped to the season.',
        journalingVsDoing: 'Pure journaling. Do not convert the deadline into a Do.',
        flags: ['Possible Fellowship strain (snapped at kids). Do not raise now; watch for a pattern.'],
        internal: ['Question is addressed to God, not the app: do not answer it.', 'No Scripture in reply (none quoted by user).'],
      },
    }),
  },

  {
    id: 'photo',
    chip: 'Handwriting photo',
    mode: 'photo',
    text: PHOTO,
    lookFor: 'A photo of a to-do list becomes five Dos with D / I.W codes (1.2, 2.2, 3.2, D, D); the podcast idea goes to the Seed Vault.',
    build: (_p, entryId) => {
      const t = today();
      const mk = (text: string, code: Do['code'], priority: Do['priority'], waymarkId?: string, initiativeId?: string): Do => ({
        id: uid('do'), text, code, date: t, done: false, waymarkId, initiativeId, priority, hours: 0.5, sourceEntryId: entryId,
      });
      const dos = [
        mk('Call Mom back', 'D', 1),
        mk('Box up the garage shelves', '1.2', 1, 'w1-2', 'i1'),
        mk('Email the printer about the proof', '2.2', 1, 'w2-2', 'i2'),
        mk('Outline TMKS week 6 notes', '3.2', 2, 'w3-2', 'i3'),
        mk('Pay the water bill', 'D', 2),
      ];
      const why = ['Not tied to an initiative; Fellowship (Core).', 'Matches I1 · W2 Garage sorted.', 'Matches I2 · W2 Planner ready to print.', 'Matches I3 · W2 Weeks 6 to 12.', 'Household task.'];
      const forms: FilledForm[] = [
        {
          type: 'dumpSort',
          status: 'proposed',
          data: {
            items: [
              ...dos.map((d, i) => ({ text: hi(d.text, HANDWRITING_LINES[i + 1].slice(2)), sortNo: med<number | 'V'>(i + 1) })),
              { text: med('TLN podcast', 'Idea: TLN podcast??', 'Handwriting: "??" read as uncertainty.'), sortNo: hi<number | 'V'>('V', 'Idea:') },
            ],
          },
        },
        ...dos.map<FilledForm>((d, i) => ({
          type: 'do',
          status: 'proposed',
          data: {
            text: hi(d.text, HANDWRITING_LINES[i + 1].slice(2)),
            code: (d.code === 'D' ? hi : med)(d.code, undefined, why[i]),
            date: med(t, 'Monday', 'Page header read as today.'),
            done: hi(false),
          },
        })),
      ];
      return {
        engine: 'scripted',
        scenarioId: 'photo',
        classification: { value: 'planning', confidence: 'high', signals: ['list', 'imperatives', 'idea marker'] },
        heard: 'A to-do list: five Dos and one idea.',
        oneRightAction: { text: 'Call Mom back first.', source: 'Call Mom back' },
        forms,
        proposals: [
          {
            id: uid('pr'),
            question: 'Add these five Dos to today’s Fashioned Day?',
            actions: dos.map((d) => ({ kind: 'addDo' as const, do: d })),
            confirmsForms: [0, 1, 2, 3, 4, 5],
            status: 'pending',
          },
          {
            id: uid('pr'),
            question: 'Save "TLN podcast" to the Seed Vault for later?',
            actions: [{ kind: 'addSeed', seed: { id: uid('seed'), text: 'TLN podcast', why: 'An idea from your Monday list.', savedOn: t, sourceEntryId: entryId } }],
            confirmsForms: [],
            status: 'pending',
          },
        ],
        autoActions: [],
        autoSummary: [],
        links: [
          ...dos.map((d, i) => ({ label: `→ Do ${d.code}`, source: HANDWRITING_LINES[i + 1].slice(2) })),
          { label: '→ Seed Vault', source: 'Idea: TLN podcast??' },
        ],
        notes: {
          alignment: '3 of 5 Dos map to active waymarks (1.2, 2.2, 3.2).',
          journalingVsDoing: 'Doing list. No feelings to reflect.',
          flags: ['Handwriting transcript simulated (scripted).', '"Call Mom back" touches Fellowship (Core): ranked first.'],
          internal: ['OCR confidence (simulated): 0.91 avg; "podcast??" 0.62.'],
        },
      };
    },
  },

  {
    id: 'voice',
    chip: 'Voice note',
    mode: 'voice',
    text: VOICE,
    lookFor: 'A new project idea while the days are full: Count the Cost says not now, so it is saved to the Seed Vault with a one-sentence reason.',
    build: (p, entryId) => {
      const t = today();
      const active = p.initiatives.filter((i) => i.status === 'active');
      const byDeg = (d: number) => active.filter((i) => i.degree === d).map((i) => `I${i.number}`).join(', ') || 'none';
      return {
        engine: 'scripted',
        scenarioId: 'voice',
        classification: { value: 'both', confidence: 'medium', signals: ['what if', 'excitement', 'new project'] },
        heard: 'An idea: a TLN circle, six people meeting every other Tuesday.',
        oneRightAction: { text: 'Keep today’s Dos. The circle will keep.' },
        forms: [
          {
            type: 'countTheCost',
            status: 'confirmed',
            data: {
              time: cost('about 4 hours a week to write the guide', '3 hours every other Tuesday', '0 spare hours: days are full', 'about 4 hours a week'),
              relationships: cost('six people, and the household on Tuesdays', 'steady hosting', 'Fellowship already guarded', 'family evenings', 'l'),
              financial: cost('printed guides, snacks', 'small', 'not stated', 'unknown', 'l'),
              strength: cost('evening energy', 'evening energy', 'low after work (inferred)', 'some', 'l'),
              canIBuild: med('No', undefined, 'Time short by about 4 hours a week.'),
              canIKeep: lo('Not sure'),
              ifNot: med('not now', undefined, 'Make room would cut an initiative mid-roadmap; smaller not enough.'),
              imIn: lo(''),
              firstDoDate: lo(''),
              coreGuarded: hi('Rest, Prayer & Devotion, Fellowship'),
            },
          },
          {
            type: 'journalEntry',
            status: 'confirmed',
            data: {
              rawText: hi(VOICE),
              mood: hi('excited', 'I just got really excited about it'),
            },
          },
        ],
        proposals: [],
        autoActions: [
          {
            kind: 'addSeed',
            seed: { id: uid('seed'), text: 'TLN circle: six people, every other Tuesday, walking through the planner', why: 'Not now: your days are full with your current initiatives.', savedOn: t, sourceEntryId: entryId },
          },
        ],
        autoSummary: ['Saved to the Seed Vault: TLN circle.', 'Not now: your days are already full with your current initiatives, so it will keep until there is room.'],
        links: [
          { label: '→ Seed Vault: TLN circle', source: 'What if we started a TLN circle' },
          { label: '→ Count the Cost: not now', source: 'every other Tuesday night' },
        ],
        notes: {
          alignment: 'Good fit for the season later (Fellowship + TLN), not now.',
          journalingVsDoing: 'Idea energy. Capture it so it is not lost; do not start it.',
          flags: [`All degrees busy: degree 3 (${byDeg(3)}), degree 2 (${byDeg(2)}), degree 1 (${byDeg(1)}). Weekly hours fully committed.`, 'Seed Vault save is safe to do without asking.'],
          internal: ['Voice transcript: Web Speech if available, else scripted.'],
        },
      };
    },
  },
];

export const scenarioById = (id?: string) => SCENARIOS.find((s) => s.id === id);

/** A typed entry that exactly matches a sample uses the scripted mapping. */
export function matchScenario(text: string): Scenario | undefined {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const n = norm(text);
  return SCENARIOS.find((s) => norm(s.text) === n);
}
