import { useState } from 'react';
import type { Item, ItemStatus, ItemType, Priority, Release } from '../types';
import { useWorkspace } from '../state/workspace';
import { Btn, Field, Select, inputCls } from '../components/ui';
import { prettyDateTime } from '../lib/dates';

export const TYPES: ItemType[] = ['Requirement', 'Feature', 'Question', 'Decision'];
export const PRIORITIES: Priority[] = ['Must', 'Should', 'Could', "Won't for now"];
export const RELEASES: Release[] = ['Prototype', 'MVP', 'Later'];
export const STATUSES: ItemStatus[] = ['Idea', 'Agreed', 'Built', 'Dropped'];

type Draft = Pick<Item, 'title' | 'description' | 'type' | 'priority' | 'release' | 'status'>;
const blank: Draft = { title: '', description: '', type: 'Requirement', priority: 'Should', release: 'MVP', status: 'Idea' };

export function ItemForm({ initial, onSave, onCancel, submitLabel = 'Save' }: { initial?: Draft; onSave: (d: Draft) => void; onCancel: () => void; submitLabel?: string }) {
  const [d, setD] = useState<Draft>(initial ?? blank);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="space-y-3 rounded-xl border border-line bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (d.title.trim()) onSave({ ...d, title: d.title.trim() });
      }}
    >
      <Field label="Title">
        <input className={inputCls} value={d.title} onChange={(e) => set('title', e.target.value)} required autoFocus />
      </Field>
      <Field label="Description">
        <textarea className={inputCls} rows={3} value={d.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Select label="Type" value={d.type} onChange={(v) => set('type', v)} options={TYPES} />
        <Select label="Priority" value={d.priority} onChange={(v) => set('priority', v)} options={PRIORITIES} />
        <Select label="Release" value={d.release} onChange={(v) => set('release', v)} options={RELEASES} />
        <Select label="Status" value={d.status} onChange={(v) => set('status', v)} options={STATUSES} />
      </div>
      <div className="flex gap-2">
        <Btn type="submit">{submitLabel}</Btn>
        <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </form>
  );
}

const statusTone: Record<ItemStatus, string> = { Idea: 'bg-[#F1ECDF] text-ink', Agreed: 'bg-accent-soft text-accent-ink', Built: 'bg-accent text-white', Dropped: 'bg-[#EEE] text-muted line-through' };

export function ItemMeta({ i }: { i: Item }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
      <span className="rounded bg-[#ECE7DA] px-1.5 py-0.5">{i.type}</span>
      <span className="rounded bg-[#ECE7DA] px-1.5 py-0.5">{i.priority}</span>
      <span className="rounded bg-[#ECE7DA] px-1.5 py-0.5">{i.release}</span>
      <span className={`rounded px-1.5 py-0.5 ${statusTone[i.status]}`}>{i.status}</span>
      {i.featureRequestId && <span className="rounded border border-[#C77C02] px-1.5 py-0.5 text-[#7A4A00]">from Feedback</span>}
    </div>
  );
}

export function ItemRow({ i, onOpenNode, nodeLabel }: { i: Item; onOpenNode?: () => void; nodeLabel?: string }) {
  const ws = useWorkspace();
  const [editing, setEditing] = useState(false);
  const fr = ws.featureRequests.find((f) => f.itemId === i.id);
  if (editing)
    return (
      <li>
        <ItemForm
          initial={i}
          onSave={(d) => {
            ws.updateItem(i.id, d);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  return (
    <li className="rounded-xl border border-line bg-card p-3" data-feedback-id={`item-${i.id}`}>
      <div className="font-medium">{i.title}</div>
      {i.description && <p className="mt-0.5 whitespace-pre-wrap text-sm">{i.description}</p>}
      {fr?.why && <p className="mt-0.5 text-sm text-muted">Why: {fr.why}</p>}
      <ItemMeta i={i} />
      <div className="mt-1 text-[11px] text-muted">
        Created {prettyDateTime(i.createdAt)} · Updated {prettyDateTime(i.updatedAt)}
        {nodeLabel && <> · on {nodeLabel}</>}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {onOpenNode && <Btn kind="quiet" onClick={onOpenNode}>Open node</Btn>}
        <Btn kind="quiet" onClick={() => setEditing(true)}>Edit</Btn>
        <Btn
          kind="quiet"
          onClick={() => {
            if (window.confirm(`Delete "${i.title}"?`)) ws.deleteItem(i.id);
          }}
        >
          Delete
        </Btn>
      </div>
    </li>
  );
}
