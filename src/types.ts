/* ------------------------------------------------------------------ *
 * The Life NOW prototype: every data shape lives here, so a real
 * backend can replace localStorage later without touching the screens.
 * ------------------------------------------------------------------ */

export type ISODate = string; // yyyy-mm-dd
export type ISODateTime = string; // full ISO timestamp

/* ============================== Capture ============================== */

export type CaptureMode = 'typed' | 'voice' | 'photo';

export type Confidence = 'high' | 'medium' | 'low';

/** One extracted value, with how sure the agent is and the exact words it came from. */
export interface Field<T = string> {
  value: T;
  confidence: Confidence;
  /** Exact words from the raw entry. Missing when the value was inferred, not quoted. */
  source?: string;
  /** Why the agent filled it this way (Under the floor only). */
  note?: string;
}

/* ========================== Planning hierarchy ========================= */
/* Season → Initiatives → Roadmap → Waymark stone → Stake → Do            */

export type Degree = 1 | 2 | 3; // 3 new · 2 maturing · 1 direct impact
export type Reached = 'Yes' | 'Partly' | 'Not yet';

export interface Season {
  id: string;
  name: string;
  strategy: string;
  startedOn: ISODate;
  /** Sabbath window, shown on the surface in plain words. */
  sabbath: { label: string; startDay: 5; startHour: number; endDay: 6; endHour: number };
}

export interface Initiative {
  id: string;
  /** I1, I2, … never reused. */
  number: number;
  lane: string; // Mess · Prepare · Observe · …
  name: string;
  degree: Degree;
  status: 'active' | 'draft' | 'finished';
  vision: string;
  youAreHere: string;
  finishedWhen: string;
  parentId?: string;
  startOn?: ISODate;
  finishedBy?: ISODate;
  sourceEntryId?: string;
}

export interface CheckIn {
  reached: Reached | null;
  coreKept: boolean | null;
  wentWell?: string;
  inTheWay?: string;
  next?: 'next waymark' | 're-sort' | 'take it to the gate';
  on?: ISODate;
}

export interface Waymark {
  id: string;
  initiativeId: string;
  number: number; // W1, W2, …
  title: string;
  reachBy?: ISODate;
  /** ONE stake: the one thing that must be true to reach it. */
  stake: string;
  status: 'active' | 'draft';
  checkIn: CheckIn;
}

/** D = Day in the Life; "3.2" = Initiative 3 · Waymark 2. */
export type DoCode = 'D' | `${number}.${number}`;

export interface Do {
  id: string;
  text: string;
  code: DoCode;
  date: ISODate;
  done: boolean;
  waymarkId?: string;
  initiativeId?: string;
  sortNo?: number;
  priority: 1 | 2 | 3;
  hours?: number;
  sourceEntryId?: string;
}

export interface SeedItem {
  id: string;
  text: string;
  why: string;
  savedOn: ISODate;
  sourceEntryId?: string;
}

export type CoreKey = 'rest' | 'prayer' | 'fellowship';
export type CoreLog = Record<ISODate, Partial<Record<CoreKey, boolean>>>;

export interface Planning {
  season: Season;
  initiatives: Initiative[];
  waymarks: Waymark[];
  dos: Do[];
  seeds: SeedItem[];
  core: CoreLog;
  nextInitiativeNumber: number;
}

/* ========================= Workbook forms (schemas) ========================= */

export type StartingPointKind = 'Seeking Direction' | 'Seeking Purpose' | 'Seeking Clarity';

/** 1 · Starting point */
export interface StartingPointForm {
  kind: Field<StartingPointKind>;
  /** Where it leads: Set Your House in Order · Prepare Your Field · Make It Plain. */
  leadsTo: Field<'Set Your House in Order' | 'Prepare Your Field' | 'Make It Plain'>;
  signals: Field<string[]>;
}

/** 2 · Make It Plain */
export interface MakeItPlainForm {
  name: Field;
  initiativeNumber: Field<string>; // "I4"
  vision: Field;
  youAreHere: Field;
  finishedWhen: Field;
  parentInitiative?: Field;
  startOn: Field;
  finishedBy: Field; // may be blank
}

/** 3 · Dump. Sort. */
export interface DumpSortForm {
  items: Array<{ text: Field; sortNo: Field<number | 'V'> }>;
}

/** 4 · Waymarks & Stakes */
export interface WaymarksStakesForm {
  waymark: Field<string>; // "W1"
  title: Field;
  reachBy: Field;
  stake: Field;
  dos: Array<{ sortNo: Field<number>; text: Field; priority: Field<1 | 2 | 3>; hours: Field<number> }>;
  checkIn: { reached: Field<Reached | ''>; coreKept: Field<'Yes' | 'No' | ''> };
}

/** 5 · Roadmap */
export interface RoadmapForm {
  initiative: Field;
  youAreHere: Field;
  waymarks: Array<Field>;
  finished: Field;
}

export type CostRow = { toBuild: Field; toKeep: Field; iHave: Field; shortBy: Field };

/** 6 · Count the Cost */
export interface CountTheCostForm {
  time: CostRow;
  relationships: CostRow;
  financial: CostRow;
  strength: CostRow;
  canIBuild: Field<'Yes' | 'No' | 'Not sure'>;
  canIKeep: Field<'Yes' | 'No' | 'Not sure'>;
  ifNot: Field<'make room' | 'make it smaller' | 'not now' | ''>;
  imIn: Field<'Yes' | 'No' | ''>;
  firstDoDate: Field;
  /** Never cut: Rest, Prayer & Devotion, Fellowship. */
  coreGuarded: Field<'Rest, Prayer & Devotion, Fellowship'>;
}

/** 7 · Check the map */
export interface CheckTheMapForm {
  waymark: Field;
  didIReachIt: Field<Reached>;
  wentWell: Field;
  inTheWay: Field;
  coreKept: Field<'Yes' | 'No' | 'Partly'>;
  next: Field<'on to the next waymark' | 're-sort' | 'take it to the gate'>;
}

/** 8 · Journal entry */
export interface JournalEntryForm {
  rawText: Field;
  mood?: Field;
  praise?: Field;
  testify?: Field;
  vent?: Field;
  sensingHeSays?: Field;
  questions?: Field<string[]>;
}

/** 9 · Do */
export interface DoForm {
  text: Field;
  code: Field<string>;
  date: Field;
  done: Field<boolean>;
}

export type FormType =
  | 'startingPoint'
  | 'makeItPlain'
  | 'dumpSort'
  | 'waymarksStakes'
  | 'roadmap'
  | 'countTheCost'
  | 'checkTheMap'
  | 'journalEntry'
  | 'do';

export const FORM_LABELS: Record<FormType, string> = {
  startingPoint: 'Starting point',
  makeItPlain: 'Make It Plain',
  dumpSort: 'Dump. Sort.',
  waymarksStakes: 'Waymarks & Stakes',
  roadmap: 'Roadmap',
  countTheCost: 'Count the Cost',
  checkTheMap: 'Check the map',
  journalEntry: 'Journal entry',
  do: 'Do',
};

export type FilledForm =
  | { type: 'startingPoint'; status: FormStatus; data: StartingPointForm }
  | { type: 'makeItPlain'; status: FormStatus; data: MakeItPlainForm }
  | { type: 'dumpSort'; status: FormStatus; data: DumpSortForm }
  | { type: 'waymarksStakes'; status: FormStatus; data: WaymarksStakesForm }
  | { type: 'roadmap'; status: FormStatus; data: RoadmapForm }
  | { type: 'countTheCost'; status: FormStatus; data: CountTheCostForm }
  | { type: 'checkTheMap'; status: FormStatus; data: CheckTheMapForm }
  | { type: 'journalEntry'; status: FormStatus; data: JournalEntryForm }
  | { type: 'do'; status: FormStatus; data: DoForm };

/** draft = low confidence or not confirmed; proposed = waiting on Yes; confirmed = written. */
export type FormStatus = 'draft' | 'proposed' | 'confirmed';

/* ============================== Mapping ============================== */

export type Classification = 'journal' | 'planning' | 'both';

export type PlanAction =
  | { kind: 'addDo'; do: Do }
  | { kind: 'markDoDone'; doId: string }
  | { kind: 'checkIn'; waymarkId: string; checkIn: CheckIn }
  | { kind: 'addInitiative'; initiative: Initiative; waymarks: Waymark[]; dos: Do[] }
  | { kind: 'addSeed'; seed: SeedItem }
  | { kind: 'core'; date: ISODate; key: CoreKey; kept: boolean };

export interface Proposal {
  id: string;
  /** One plain sentence, asked of the user. */
  question: string;
  actions: PlanAction[];
  /** Forms (by index in mapping.forms) that become confirmed on Yes. */
  confirmsForms: number[];
  status: 'pending' | 'yes' | 'notnow';
}

/** Small chip on a Journal entry: what was mapped and from which words. */
export interface MapLink {
  label: string; // "→ Do 2.3"
  source?: string;
}

export interface Mapping {
  engine: 'scripted' | 'rules';
  scenarioId?: string;
  classification: { value: Classification; confidence: Confidence; signals: string[] };
  startingPoint?: StartingPointKind;
  /** One line: what was heard. */
  heard: string;
  oneRightAction: { text: string; source?: string };
  forms: FilledForm[];
  proposals: Proposal[];
  /** Stated facts the agent records directly (e.g. "I finished X"). */
  autoActions: PlanAction[];
  autoSummary: string[];
  links: MapLink[];
  /** Distress: planning set aside, respond with care. */
  care?: boolean;
  notes: {
    alignment: string;
    journalingVsDoing: string;
    flags: string[];
    internal: string[];
  };
}

export interface Entry {
  id: string;
  createdAt: ISODateTime;
  mode: CaptureMode;
  /** Exactly as written (or as transcribed). Never edited by the app. */
  rawText: string;
  transcriptSource?: 'web-speech' | 'scripted' | 'handwriting-scripted';
  imageDataUrl?: string;
  hasAudio?: boolean;
  mapping: Mapping;
}

/* ============================== Blueprint ============================== */

export type SectionId = 'mapping' | 'hierarchy' | 'tracks' | 'forms' | 'screens';

export type ScreenId = 'slate' | 'today' | 'season' | 'journal' | 'blueprint';

export interface ShowMe {
  screen: ScreenId;
  underFloor?: boolean;
  scenarioId?: string;
}

export interface Node {
  id: string;
  section: SectionId;
  label: string;
  sublabel?: string;
  description: string;
  behavior: string;
  showMe?: ShowMe;
  highlighted?: boolean;
  x: number;
  y: number;
  notes: string;
  custom?: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  dashed?: boolean;
  label?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type ItemType = 'Requirement' | 'Feature' | 'Question' | 'Decision';
export type Priority = 'Must' | 'Should' | 'Could' | "Won't for now";
export type Release = 'Prototype' | 'MVP' | 'Later';
export type ItemStatus = 'Idea' | 'Agreed' | 'Built' | 'Dropped';

export interface Item {
  id: string;
  nodeId: string;
  title: string;
  description: string;
  type: ItemType;
  priority: Priority;
  release: Release;
  status: ItemStatus;
  /** Set when the item came from a Feedback feature request. */
  featureRequestId?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/* ============================== Feedback ============================== */

export type CommentType = 'Comment' | 'Bug' | 'Feature request' | 'Question';

export interface Reply {
  id: string;
  text: string;
  createdAt: ISODateTime;
}

export interface Comment {
  id: string;
  number: number;
  screen: ScreenId;
  /** Stable data-feedback-id of the element it was pinned to. */
  elementId: string;
  /** Where on the element the marker sits, 0–1. */
  ox: number;
  oy: number;
  text: string;
  type: CommentType;
  resolved: boolean;
  replies: Reply[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** A feature request lives as an Item on a Blueprint node (one list), plus the "why". */
export interface FeatureRequest {
  id: string;
  itemId: string;
  why: string;
  screen?: ScreenId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Workspace {
  nodes: Node[];
  edges: Edge[];
  items: Item[];
  comments: Comment[];
  featureRequests: FeatureRequest[];
}

export interface WorkspaceExport extends Workspace {
  app: 'tln-prototype';
  version: 1;
  exportedAt: ISODateTime;
}
