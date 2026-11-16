import { useEffect, useState } from 'react';
import type { Node } from '../types';
import { useWorkspace } from '../state/workspace';
import { useUi } from '../state/ui';
import { sectionTitle } from '../data/blueprintSeed';
import { scenarioById } from '../data/scenarios';
import { Btn, Field, Sheet, inputCls } from '../components/ui';
import { IconArrow, IconClose } from '../components/Icons';
import { ItemForm, ItemRow } from './Items';
import { byPriority } from '../lib/exporters';

const SCREEN_NAMES: Record<string, string> = { slate: 'Slate', today: 'Today', season: 'Season', journal: 'Journal', blueprint: 'Blueprint' };

export function NodeDrawer({ node, onClose, onOpen }: { node: Node | null; onClose: () => void; onOpen: (id: string) => void }) {
  const ws = useWorkspace();
  const ui = useUi();
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!node) return;
    setLabel(node.label);
    setDesc(node.description);
    setNotes(node.notes);
    setRenaming(false);
    setAdding(false);
    // reset when a different node opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  if (!node) return null;
  const items = ws.items.filter((i) => i.nodeId === node.id).sort(byPriority);
  const out = ws.edges.filter((e) => e.from === node.id);
  const inc = ws.edges.filter((e) => e.to === node.id);
  const nodeById = (id: string) => ws.nodes.find((n) => n.id === id);
  const sm = node.showMe;

  return (
    <Sheet open onClose={onClose} title={node.label} wide fid={`bp-drawer-${node.id}`}>
      <p className="text-sm text-muted">
        {sectionTitle(node.section)}
        {node.sublabel && <> · {node.sublabel}</>}
        {node.custom && <> · added by you</>}
      </p>

      {renaming ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (label.trim()) ws.updateNode(node.id, { label: label.trim() });
            setRenaming(false);
          }}
        >
          <label className="sr-only" htmlFor="rename">Node name</label>
          <input id="rename" className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          <Btn type="submit">Save</Btn>
        </form>
      ) : (
        <Btn kind="quiet" className="mt-1 -ml-2" onClick={() => setRenaming(true)}>Rename</Btn>
      )}

      <section className="mt-3">
        <h3 className="eyebrow">What it is</h3>
        <textarea
          aria-label="What it is"
          className={`${inputCls} mt-1`}
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => desc !== node.description && ws.updateNode(node.id, { description: desc })}
        />
      </section>

      <section className="mt-4">
        <h3 className="eyebrow">Current behavior in the prototype</h3>
        <p className="mt-1 text-base">{node.behavior}</p>
        {sm && (
          <Btn kind="quiet" className="-ml-2 mt-1" onClick={() => ui.showMe(sm)}>
            Show me: {SCREEN_NAMES[sm.screen]}
            {sm.scenarioId && ` with the "${scenarioById(sm.scenarioId)?.chip}" sample`}
            {sm.underFloor && ', under the floor'} <IconArrow size={18} />
          </Btn>
        )}
      </section>

      <section className="mt-4">
        <h3 className="eyebrow">Linked items</h3>
        {out.length + inc.length === 0 && <p className="mt-1 text-sm text-muted">No arrows yet. Use "Draw arrow" on the board.</p>}
        <div className="mt-1 flex flex-wrap gap-2">
          {[...inc.map((e) => ({ e, other: e.from, dir: '←' })), ...out.map((e) => ({ e, other: e.to, dir: '→' }))].map(({ e, other, dir }) => {
            const n = nodeById(other);
            if (!n) return null;
            return (
              <span key={e.id} className="inline-flex items-center rounded-full border border-line bg-card">
                <button type="button" className="min-h-[44px] pl-3 pr-1 text-sm font-medium" onClick={() => onOpen(n.id)}>
                  {dir} {n.label}
                  {e.dashed && ' (dashed)'}
                </button>
                <button type="button" className="tap h-11 w-11 text-muted" aria-label={`Remove arrow ${dir} ${n.label}`} onClick={() => ws.deleteEdge(e.id)}>
                  <IconClose size={16} />
                </button>
              </span>
            );
          })}
        </div>
      </section>

      <section className="mt-5" data-feedback-id={`bp-items-${node.id}`}>
        <div className="flex items-center justify-between">
          <h3 className="eyebrow">Requirements & features ({items.length})</h3>
          {!adding && <Btn kind="quiet" onClick={() => setAdding(true)}>+ Add item</Btn>}
        </div>
        {adding && (
          <div className="mt-2">
            <ItemForm
              submitLabel="Add"
              onSave={(d) => {
                ws.addItem({ ...d, nodeId: node.id });
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}
        <ul className="mt-2 space-y-2">
          {items.map((i) => (
            <ItemRow key={i.id} i={i} />
          ))}
        </ul>
        {items.length === 0 && !adding && <p className="mt-1 text-sm text-muted">Nothing yet.</p>}
      </section>

      <section className="mt-5">
        <Field label="Notes">
          <textarea className={inputCls} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== node.notes && ws.updateNode(node.id, { notes })} />
        </Field>
      </section>

      {node.custom && (
        <div className="mt-5 border-t border-line pt-3">
          <Btn
            kind="danger"
            onClick={() => {
              if (window.confirm(`Delete the node "${node.label}" and its arrows?`)) {
                ws.deleteNode(node.id);
                onClose();
              }
            }}
          >
            Delete node
          </Btn>
        </div>
      )}
    </Sheet>
  );
}
