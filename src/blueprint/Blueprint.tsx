import { useEffect, useMemo, useState } from 'react';
import type { Item, ItemStatus, ItemType, Priority, Release, SectionId } from '../types';
import { useWorkspace, isOpen } from '../state/workspace';
import { useUi } from '../state/ui';
import { SECTIONS, slotPosition } from '../data/blueprintSeed';
import { Board } from './Board';
import { NodeDrawer } from './NodeDrawer';
import { ItemRow, PRIORITIES, RELEASES, STATUSES, TYPES } from './Items';
import { Btn, Field, Select, Sheet, inputCls } from '../components/ui';
import { IconArrow, IconGrid, IconList, IconPlus } from '../components/Icons';
import { byPriority } from '../lib/exporters';
import { DevPanel } from '../underfloor/Machinery';

type Tab = 'board' | 'all' | 'mvp' | 'questions';

function AddNodeSheet({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const ws = useWorkspace();
  const [section, setSection] = useState<SectionId>('mapping');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="Add a node">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          const idx = ws.nodes.filter((n) => n.section === section).length;
          const n = ws.addNode({ section, label: label.trim(), description: description.trim(), ...slotPosition(section, idx) });
          setLabel('');
          setDescription('');
          onAdded(n.id);
        }}
      >
        <Field label="Section">
          <select className={inputCls} value={section} onChange={(e) => setSection(e.target.value as SectionId)}>
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </Field>
        <Field label="Label">
          <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Btn type="submit">Add node</Btn>
      </form>
    </Sheet>
  );
}

function ListView({ counts, onOpen }: { counts: Record<string, number>; onOpen: (id: string) => void }) {
  const ws = useWorkspace();
  return (
    <div className="space-y-3">
      {SECTIONS.map((s) => (
        <details key={s.id} className="card overflow-hidden" open={s.id === 'mapping'}>
          <summary className="flex min-h-[52px] cursor-pointer items-center px-4 font-heading text-lg font-semibold">{s.title}</summary>
          <ul className="divide-y divide-line border-t border-line">
            {ws.nodes
              .filter((n) => n.section === s.id)
              .map((n) => (
                <li key={n.id} data-feedback-id={`bp-list-${n.id}`}>
                  <button type="button" onClick={() => onOpen(n.id)} className="flex min-h-[56px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-paper">
                    <span className="flex-1">
                      <span className={`block font-medium ${n.highlighted ? 'text-accent-ink' : ''}`}>{n.label}</span>
                      {n.sublabel && <span className="block text-sm text-muted">{n.sublabel}</span>}
                    </span>
                    {counts[n.id] ? <span className="rounded-full bg-[#9A5B00] px-2 py-0.5 text-xs font-bold text-white" aria-label={`${counts[n.id]} open items`}>{counts[n.id]}</span> : null}
                    <IconArrow size={18} className="text-muted" />
                  </button>
                </li>
              ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

function AllItems({ onOpen }: { onOpen: (id: string) => void }) {
  const ws = useWorkspace();
  const [type, setType] = useState<ItemType | 'Any'>('Any');
  const [prio, setPrio] = useState<Priority | 'Any'>('Any');
  const [rel, setRel] = useState<Release | 'Any'>('Any');
  const [st, setSt] = useState<ItemStatus | 'Any'>('Any');
  const list = ws.items.filter((i) => (type === 'Any' || i.type === type) && (prio === 'Any' || i.priority === prio) && (rel === 'Any' || i.release === rel) && (st === 'Any' || i.status === st));
  const groups = ws.nodes.map((n) => ({ n, items: list.filter((i) => i.nodeId === n.id).sort(byPriority) })).filter((g) => g.items.length);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-feedback-id="bp-filters">
        <Select label="Type" value={type} onChange={setType} options={['Any', ...TYPES] as const} />
        <Select label="Priority" value={prio} onChange={setPrio} options={['Any', ...PRIORITIES] as const} />
        <Select label="Release" value={rel} onChange={setRel} options={['Any', ...RELEASES] as const} />
        <Select label="Status" value={st} onChange={setSt} options={['Any', ...STATUSES] as const} />
      </div>
      <p className="mt-2 text-sm text-muted">{list.length} of {ws.items.length} items</p>
      {groups.length === 0 && <Empty />}
      {groups.map(({ n, items }) => (
        <section key={n.id} className="mt-4">
          <h3 className="font-heading text-base font-semibold">
            <button type="button" className="min-h-[44px] underline decoration-line underline-offset-4" onClick={() => onOpen(n.id)}>{n.label}</button>
          </h3>
          <ul className="space-y-2">
            {items.map((i) => (
              <ItemRow key={i.id} i={i} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="card mt-3 p-5 text-center text-muted">No items yet. Open a node on the board and add one, or use Feedback → + Feature.</p>;
}

function FlatList({ items, onOpen }: { items: Item[]; onOpen: (id: string) => void }) {
  const ws = useWorkspace();
  if (!items.length) return <Empty />;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <ItemRow key={i.id} i={i} nodeLabel={ws.nodes.find((n) => n.id === i.nodeId)?.label} onOpenNode={() => onOpen(i.nodeId)} />
      ))}
    </ul>
  );
}

export function Blueprint() {
  const ws = useWorkspace();
  const ui = useUi();
  const [tab, setTab] = useState<Tab>('board');
  const [listView, setListView] = useState(() => typeof window !== 'undefined' && window.innerWidth < 360);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [arrowMode, setArrowMode] = useState(false);
  const [arrowFrom, setArrowFrom] = useState<string | null>(null);

  useEffect(() => {
    if (ui.openNode) {
      setTab('board');
      setOpen(ui.openNode);
      ui.setOpenNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.openNode]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    ws.items.filter(isOpen).forEach((i) => (c[i.nodeId] = (c[i.nodeId] ?? 0) + 1));
    return c;
  }, [ws.items]);

  const onNode = (id: string) => {
    if (arrowMode) {
      if (!arrowFrom) setArrowFrom(id);
      else {
        ws.addEdge(arrowFrom, id);
        ui.say(`Arrow added: ${ws.nodes.find((n) => n.id === arrowFrom)?.label} → ${ws.nodes.find((n) => n.id === id)?.label}`);
        setArrowFrom(null);
        setArrowMode(false);
      }
      return;
    }
    setOpen(id);
  };

  const node = ws.nodes.find((n) => n.id === open) ?? null;
  const mvp = ws.items.filter((i) => i.release === 'MVP').sort(byPriority);
  const questions = ws.items.filter((i) => i.type === 'Question' && i.status !== 'Dropped').sort(byPriority);
  const TABS: Array<[Tab, string]> = [['board', 'Board'], ['all', `All items (${ws.items.length})`], ['mvp', `MVP list (${mvp.length})`], ['questions', `Open questions (${questions.length})`]];

  return (
    <div>
      <h1 className="sr-only">Blueprint</h1>
      <p className="text-sm text-muted">A living whiteboard of the system. Tap a node to see what it is and record requirements.</p>
      <div role="tablist" aria-label="Blueprint views" className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4 pb-1" data-feedback-id="bp-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium ${tab === id ? 'bg-ink text-white' : 'border border-line bg-card'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <div className="mt-3">
          <div className="mb-2 flex flex-wrap gap-2" data-feedback-id="bp-toolbar">
            <Btn kind="ghost" onClick={() => setListView(!listView)} label={listView ? 'Show board view' : 'Show list view'}>
              {listView ? <IconGrid size={18} /> : <IconList size={18} />} {listView ? 'Board view' : 'List view'}
            </Btn>
            <Btn kind="ghost" onClick={() => setAdding(true)}>
              <IconPlus size={18} /> Add node
            </Btn>
            {!listView && (
              <Btn kind={arrowMode ? 'primary' : 'ghost'} onClick={() => { setArrowMode(!arrowMode); setArrowFrom(null); }} label="Draw arrow">
                <IconArrow size={18} /> {arrowMode ? 'Cancel arrow' : 'Draw arrow'}
              </Btn>
            )}
            <Btn kind="ghost" onClick={() => ui.setOverlay('data')}>Export</Btn>
          </div>
          {arrowMode && (
            <p className="mb-2 rounded-lg bg-[#FDF0D5] px-3 py-2 text-sm text-[#5C3800]" role="status">
              {arrowFrom ? `From "${ws.nodes.find((n) => n.id === arrowFrom)?.label}". Now tap the node it points to.` : 'Tap the node the arrow starts from.'}
            </p>
          )}
          {listView ? <ListView counts={counts} onOpen={setOpen} /> : <Board nodes={ws.nodes} edges={ws.edges} openCounts={counts} selected={open} arrowFrom={arrowFrom} onNode={onNode} />}
          {!listView && <p className="mt-2 text-xs text-muted">Drag to pan. Pinch or use the buttons to zoom. Orange badges count open items.</p>}
        </div>
      )}
      {tab === 'all' && <div className="mt-3"><AllItems onOpen={setOpen} /></div>}
      {tab === 'mvp' && <div className="mt-3"><p className="mb-2 text-sm text-muted">Release = MVP, sorted by priority.</p><FlatList items={mvp} onOpen={setOpen} /></div>}
      {tab === 'questions' && <div className="mt-3"><p className="mb-2 text-sm text-muted">Type = Question, not dropped.</p><FlatList items={questions} onOpen={setOpen} /></div>}

      {ui.underFloor && (
        <DevPanel title="blueprint store (types.ts: Node, Edge, Item, Comment, FeatureRequest)">
          <div>localStorage key: tln.workspace.v1 · survives Reset demo</div>
          <div>nodes={ws.nodes.length} edges={ws.edges.length} items={ws.items.length} comments={ws.comments.length} featureRequests={ws.featureRequests.length}</div>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-dev-line bg-black/30 p-2">{JSON.stringify(node ?? ws.nodes.find((n) => n.highlighted), null, 2)}</pre>
        </DevPanel>
      )}
      <NodeDrawer node={node} onClose={() => setOpen(null)} onOpen={setOpen} />
      <AddNodeSheet open={adding} onClose={() => setAdding(false)} onAdded={(id) => { setAdding(false); setOpen(id); }} />
    </div>
  );
}
