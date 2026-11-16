import type { Edge, Node, SectionId } from '../types';

export const SECTIONS: Array<{ id: SectionId; title: string; y: number }> = [
  { id: 'mapping', title: 'Blank Slate mapping', y: 0 },
  { id: 'hierarchy', title: 'Planning hierarchy', y: 190 },
  { id: 'tracks', title: 'Build tracks', y: 380 },
  { id: 'forms', title: 'Forms', y: 570 },
  { id: 'screens', title: 'Screens', y: 850 },
];

export const NODE_W = 184;
export const NODE_H = 70;
export const COL_W = 224;
export const ROW_H = 120;
export const PER_ROW = 6;

export const sectionTitle = (id: SectionId) => SECTIONS.find((s) => s.id === id)?.title ?? id;

export function slotPosition(section: SectionId, index: number): { x: number; y: number } {
  const s = SECTIONS.find((x) => x.id === section)!;
  return { x: 24 + (index % PER_ROW) * COL_W, y: s.y + 48 + Math.floor(index / PER_ROW) * ROW_H };
}

type Seed = Omit<Node, 'x' | 'y' | 'notes' | 'createdAt' | 'updatedAt'>;

const SEED: Seed[] = [
  /* ---------- 1 · Blank Slate mapping ---------- */
  { id: 'n-slate-input', section: 'mapping', label: 'Blank Slate', sublabel: 'type · voice · photo', description: 'The one surface the user writes on. Capture by typing, a voice recording, or a photo of a handwritten page.', behavior: 'Slate tab: a calm page with "Pour out your heart", a mic button (MediaRecorder + Web Speech if available), a photo button (file input with capture), and sample-entry chips.', showMe: { screen: 'slate' } },
  { id: 'n-normalize', section: 'mapping', label: 'Normalize', sublabel: 'speech · handwriting → text', description: 'Voice and handwriting become text before anything else happens.', behavior: 'Simulated. Voice uses the browser’s Web Speech API when present, otherwise the scripted transcript. Photos always use the scripted "read from your handwriting" transcript.', showMe: { screen: 'slate', underFloor: true, scenarioId: 'photo' } },
  { id: 'n-classify', section: 'mapping', label: 'Classify', sublabel: 'journal · planning · both', description: 'Decide whether the entry is journal, planning, or both. The raw entry is always saved first, exactly as written.', behavior: 'Scripted for the six samples; keyword rules for anything else. Shown under the floor with signals.', showMe: { screen: 'slate', underFloor: true, scenarioId: 'journal' } },
  { id: 'n-extract', section: 'mapping', label: 'Extract into forms', sublabel: 'workbook pages, filled by AI', highlighted: true, description: 'The AI agent fills whichever workbook forms the entry speaks to. Every field carries a confidence (high / medium / low) and a link back to the exact words it came from.', behavior: 'Simulated with scripted mappings and rules. Under the floor shows each filled form with confidence and source quotes.', showMe: { screen: 'slate', underFloor: true, scenarioId: 'vision' } },
  { id: 'n-confirm', section: 'mapping', label: 'Confirm', sublabel: 'user approves what matters', description: 'Show the user only what matters, one plain sentence each, with Yes / Not now. Low-confidence fields stay drafts. Propose, never impose.', behavior: 'After saving, the response card shows up to two questions. Stated facts (e.g. "finished X") are recorded directly and listed.', showMe: { screen: 'slate', scenarioId: 'vision' } },
  { id: 'n-database', section: 'mapping', label: 'Database', sublabel: 'raw entry kept, fields linked', description: 'Write confirmed records; keep drafts as drafts. The raw entry is never edited.', behavior: 'In-memory state persisted to localStorage. Journal shows raw text with chips linking back to source words.', showMe: { screen: 'journal', underFloor: true } },

  /* ---------- 2 · Planning hierarchy ---------- */
  { id: 'n-season', section: 'hierarchy', label: 'Season', sublabel: 'the Strategy', description: 'The Strategy governing a stretch of life. A season holds several initiatives.', behavior: 'Season tab shows "Build The Life NOW" with its strategy, Core and Sabbath.', showMe: { screen: 'season' } },
  { id: 'n-initiatives', section: 'hierarchy', label: 'Initiatives', sublabel: 'Mess · Prepare · Observe', description: 'Numbered I1, I2, … never reused. Degree 3 (new), 2 (maturing), 1 (direct impact); at most 3 per degree.', behavior: 'Season tab lists initiatives with degree badges. The Clear vision sample proposes I4.', showMe: { screen: 'season' } },
  { id: 'n-roadmap', section: 'hierarchy', label: 'Roadmap', sublabel: 'the hour', description: 'The initiative’s waymarks in order, from "you are here" to finished.', behavior: 'Drawn as a vertical road of waymark stones under each initiative.', showMe: { screen: 'season' } },
  { id: 'n-waymark', section: 'hierarchy', label: 'Waymark stone', sublabel: 'the milestone', description: 'A milestone (W1, W2, …). Each has one stake and a check-in.', behavior: 'Tap a stone on Season to see its stake, Dos and check-in.', showMe: { screen: 'season' } },
  { id: 'n-stake', section: 'hierarchy', label: 'Stake', sublabel: 'the one thing', description: 'The one thing that must be true to reach the waymark.', behavior: 'Shown on each stone and in the waymark sheet.', showMe: { screen: 'season' } },
  { id: 'n-do', section: 'hierarchy', label: 'Do', sublabel: 'Fashioned Day in the Life, Now!', description: 'One step toward a stake. Coded D (Day in the Life) or I.W (Initiative · Waymark, e.g. 3.2). Dos make up the Fashioned Day.', behavior: 'Today tab lists today’s Dos with codes and checkboxes.', showMe: { screen: 'today' } },

  /* ---------- 3 · Build tracks ---------- */
  { id: 'n-prototype', section: 'tracks', label: 'Prototype', sublabel: 'now', description: 'This clickable prototype: no backend, simulated mapping, localStorage.', behavior: 'You are using it.', showMe: { screen: 'slate' } },
  { id: 'n-mvp', section: 'tracks', label: 'MVP', sublabel: 'next, on Claude', description: 'First real version: Claude does Normalize, Classify and Extract; a real database stores entries and records.', behavior: 'Not built. Requirements collected here in Blueprint.' },
  { id: 'n-llm', section: 'tracks', label: 'Custom LLM', sublabel: 'in parallel', description: 'A custom model trained on the TLN method, swapped in when ready.', behavior: 'Not built.' },

  /* ---------- 4 · Forms ---------- */
  { id: 'n-f-start', section: 'forms', label: 'Starting point', description: 'Seeking Direction (lost → Set Your House in Order) · Seeking Purpose (→ Prepare Your Field: 30 days of journaling, prayer and devotion) · Seeking Clarity (→ Make It Plain).', behavior: 'Filled by the Lost sample (Seeking Direction) and Clear vision (Seeking Clarity).', showMe: { screen: 'slate', underFloor: true, scenarioId: 'lost' } },
  { id: 'n-f-plain', section: 'forms', label: 'Make It Plain', description: 'Name, I#, the vision written plain, "You are here", "I’ll know it’s finished when", parent initiative (optional), "I’ll start on", "Finished by" (may be blank).', behavior: 'Drafted by the Clear vision sample.', showMe: { screen: 'slate', underFloor: true, scenarioId: 'vision' } },
  { id: 'n-f-dump', section: 'forms', label: 'Dump. Sort.', description: 'Everything it will take, then numbered in order; V = Seed Vault.', behavior: 'Started by Clear vision and the Handwriting photo.', showMe: { screen: 'slate', underFloor: true, scenarioId: 'photo' } },
  { id: 'n-f-waymarks', section: 'forms', label: 'Waymarks & Stakes', description: 'W#, waymark, reach-by date, ONE stake, Dos (Sort #, Do, priority 1/2/3, hours), check-in (Reached? Yes/Partly/Not yet; Core kept?).', behavior: 'Derived for every seeded waymark (Season, under the floor) and drafted by Clear vision / Progress.', showMe: { screen: 'season', underFloor: true } },
  { id: 'n-f-roadmap', section: 'forms', label: 'Roadmap', description: 'Waymarks in order.', behavior: 'Derived for each initiative; drafted by Clear vision.', showMe: { screen: 'season', underFloor: true } },
  { id: 'n-f-cost', section: 'forms', label: 'Count the Cost', description: 'Time, Relationships, Financial, Strength × To build it / To keep it / I have / Short by; Can I build it? Can I keep it? If not: make room / make it smaller / not now. "I’m in" with first Do date. Never cut Rest, Prayer & Devotion, Fellowship.', behavior: 'Filled by the Voice note sample (result: not now → Seed Vault).', showMe: { screen: 'slate', underFloor: true, scenarioId: 'voice' } },
  { id: 'n-f-check', section: 'forms', label: 'Check the map', description: 'Did I reach it? What went well? What got in the way? Core kept? Next: on to the next waymark / re-sort / take it to the gate.', behavior: 'Filled by the Progress sample (Partly; Core not kept).', showMe: { screen: 'slate', underFloor: true, scenarioId: 'progress' } },
  { id: 'n-f-journal', section: 'forms', label: 'Journal entry', description: 'Raw text, mood (optional), praise · testify · vent, what I sense He’s saying, questions.', behavior: 'Filled for every entry. Journal only sample fills every field.', showMe: { screen: 'slate', underFloor: true, scenarioId: 'journal' } },
  { id: 'n-f-do', section: 'forms', label: 'Do', description: 'Text, source code (D or I.W), date, done.', behavior: 'Filled by Lost, Progress, Handwriting photo and the rules fallback.', showMe: { screen: 'today', underFloor: true } },

  /* ---------- 5 · Screens ---------- */
  { id: 'n-s-slate', section: 'screens', label: 'Slate', sublabel: 'home', description: 'A large, calm blank page with one prompt: "Pour out your heart." Mic, photo, Save, and sample-entry chips.', behavior: 'Built.', showMe: { screen: 'slate' } },
  { id: 'n-s-after', section: 'screens', label: 'After saving', description: 'A short response card: what was heard, one right action for now, and up to two plain confirmation questions.', behavior: 'Built. Appears on the Slate after Save.', showMe: { screen: 'slate', scenarioId: 'lost' } },
  { id: 'n-s-today', section: 'screens', label: 'Today', sublabel: 'Fashioned Day', description: 'Today’s Dos with D / I.W codes and checkboxes; the Core shown as protected; one right action at the top. On the Sabbath: "No Do! today".', behavior: 'Built. Has a Sabbath preview switch.', showMe: { screen: 'today' } },
  { id: 'n-s-season', section: 'screens', label: 'Season', description: 'The season card, initiatives with degree badges, each Roadmap as a vertical road of waymark stones.', behavior: 'Built. Includes the Seed Vault.', showMe: { screen: 'season' } },
  { id: 'n-s-journal', section: 'screens', label: 'Journal', description: 'Entries newest first, raw text unchanged, with chips showing what was mapped. Tap a chip to highlight the source words.', behavior: 'Built.', showMe: { screen: 'journal' } },
  { id: 'n-s-floor', section: 'screens', label: 'Under the floor', description: 'Developer machinery on every screen: classification, filled forms with confidence and sources, starting point, internal notes.', behavior: 'Built. Toggle at the top right.', showMe: { screen: 'journal', underFloor: true } },
];

const E = (from: string, to: string, dashed = false): Omit<Edge, 'createdAt' | 'updatedAt'> => ({ id: `e-${from}-${to}`, from, to, dashed });

const EDGES = [
  E('n-slate-input', 'n-normalize'), E('n-normalize', 'n-classify'), E('n-classify', 'n-extract'), E('n-extract', 'n-confirm'), E('n-confirm', 'n-database'),
  E('n-season', 'n-initiatives'), E('n-initiatives', 'n-roadmap'), E('n-roadmap', 'n-waymark'), E('n-waymark', 'n-stake'), E('n-stake', 'n-do'),
  E('n-prototype', 'n-mvp'), E('n-llm', 'n-mvp', true),
  E('n-f-start', 'n-f-plain'), E('n-f-plain', 'n-f-dump'), E('n-f-dump', 'n-f-waymarks'), E('n-f-waymarks', 'n-f-roadmap'), E('n-f-roadmap', 'n-f-cost'),
  E('n-f-check', 'n-f-waymarks'), E('n-f-journal', 'n-f-do'),
  E('n-s-slate', 'n-s-after'), E('n-s-after', 'n-s-today'), E('n-s-after', 'n-s-season'), E('n-s-after', 'n-s-journal'),
];

const T0 = '2026-01-01T00:00:00.000Z';

export function seedNodes(): Node[] {
  const counts: Record<string, number> = {};
  return SEED.map((s) => {
    const i = (counts[s.section] = (counts[s.section] ?? -1) + 1);
    // Build tracks: Prototype → MVP ← Custom LLM
    const pos = slotPosition(s.section, i);
    return { ...s, ...pos, notes: '', createdAt: T0, updatedAt: T0 };
  });
}

export function seedEdges(): Edge[] {
  return EDGES.map((e) => ({ ...e, createdAt: T0, updatedAt: T0 }));
}

/** Screen → its Blueprint node. */
export const SCREEN_NODE: Record<string, string> = {
  slate: 'n-s-slate',
  today: 'n-s-today',
  season: 'n-s-season',
  journal: 'n-s-journal',
  blueprint: 'n-prototype',
};
