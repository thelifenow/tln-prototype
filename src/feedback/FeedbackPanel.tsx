import { useState } from 'react';
import type { CommentType, ItemStatus, Priority, Release, ScreenId } from '../types';
import { useUi } from '../state/ui';
import { useWorkspace } from '../state/workspace';
import { Btn, Field, Select, Sheet, inputCls } from '../components/ui';
import { SECTIONS, SCREEN_NODE } from '../data/blueprintSeed';
import { COMMENT_TYPES, SCREEN_LABEL, Thread } from './FeedbackLayer';
import { PRIORITIES, RELEASES, ItemMeta } from '../blueprint/Items';
import { prettyDateTime } from '../lib/dates';

const SCREENS: ScreenId[] = ['slate', 'today', 'season', 'journal', 'blueprint'];

export function FeatureForm() {
  const ui = useUi();
  const ws = useWorkspace();
  const [title, setTitle] = useState('');
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');
  const [nodeId, setNodeId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('Should');
  const [release, setRelease] = useState<Release>('MVP');
  const open = ui.overlay === 'feature-form';
  const target = nodeId || SCREEN_NODE[ui.screen] || 'n-prototype';
  const close = () => ui.setOverlay(null);

  return (
    <Sheet open={open} onClose={close} title="Suggest a feature">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          ws.addFeature({ item: { nodeId: target, title: title.trim(), description: what.trim(), type: 'Feature', priority, release, status: 'Idea' }, why: why.trim(), screen: ui.screen });
          const nodeLabel = ws.nodes.find((n) => n.id === target)?.label;
          setTitle(''); setWhat(''); setWhy(''); setNodeId('');
          close();
          ui.say(`Feature saved on "${nodeLabel}"`);
        }}
      >
        <Field label="Title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="What it should do"><textarea className={inputCls} rows={3} value={what} onChange={(e) => setWhat(e.target.value)} /></Field>
        <Field label="Why"><textarea className={inputCls} rows={2} value={why} onChange={(e) => setWhy(e.target.value)} /></Field>
        <Field label="Belongs to (screen or Blueprint node)">
          <select className={inputCls} value={target} onChange={(e) => setNodeId(e.target.value)}>
            {SECTIONS.map((s) => (
              <optgroup key={s.id} label={s.title}>
                {ws.nodes.filter((n) => n.section === s.id).map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Select label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          <Select label="Release" value={release} onChange={setRelease} options={RELEASES} />
        </div>
        <p className="text-xs text-muted">Saved features also appear as items on the Blueprint node, so there is one list.</p>
        <Btn type="submit">Save feature</Btn>
      </form>
    </Sheet>
  );
}

export function FeedbackPanel() {
  const ui = useUi();
  const ws = useWorkspace();
  const [screen, setScreen] = useState<ScreenId | 'Any'>('Any');
  const [type, setType] = useState<CommentType | 'Feature' | 'Any'>('Any');
  const [status, setStatus] = useState<'Open' | 'Resolved' | 'Any'>('Open');
  const [thread, setThread] = useState<string | null>(null);
  const open = ui.overlay === 'feedback-panel';

  const comments = ws.comments
    .filter((c) => (screen === 'Any' || c.screen === screen) && (type === 'Any' || c.type === type) && (status === 'Any' || (status === 'Open' ? !c.resolved : c.resolved)))
    .sort((a, b) => b.number - a.number);
  const closedStatuses: ItemStatus[] = ['Built', 'Dropped'];
  const features = ws.featureRequests
    .map((f) => ({ f, item: ws.items.find((i) => i.id === f.itemId) }))
    .filter(({ f, item }) => item && (screen === 'Any' || f.screen === screen) && (type === 'Any' || type === 'Feature' || type === 'Feature request') && (status === 'Any' || (status === 'Open' ? !closedStatuses.includes(item.status) : closedStatuses.includes(item.status))));

  return (
    <>
      <Sheet open={open && !thread} onClose={() => ui.setOverlay(null)} title="Feedback" wide>
        <div className="grid grid-cols-3 gap-2">
          <Select label="Screen" value={screen} onChange={setScreen} options={['Any', ...SCREENS] as const} />
          <Select label="Type" value={type} onChange={setType} options={['Any', ...COMMENT_TYPES, 'Feature'] as const} />
          <Select label="Status" value={status} onChange={setStatus} options={['Open', 'Resolved', 'Any'] as const} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn kind="ghost" onClick={() => ui.setOverlay('feature-form')}>+ Feature</Btn>
          {!ui.feedbackMode && <Btn kind="ghost" onClick={() => { ui.setFeedbackMode(true); ui.setOverlay(null); }}>Start commenting</Btn>}
        </div>

        <h3 className="eyebrow mt-5">Comments ({comments.length})</h3>
        {comments.length === 0 && <p className="mt-1 text-sm text-muted">None match. Turn on Feedback mode and tap anything to pin one.</p>}
        <ul className="mt-2 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-line bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${c.resolved ? 'bg-[#8C877C]' : 'bg-[#9A5B00]'}`}>{c.number}</span>
                <span className="font-semibold text-ink">{c.type}</span>
                <span>· {SCREEN_LABEL[c.screen]} · {prettyDateTime(c.createdAt)}</span>
                {c.resolved && <span>· resolved</span>}
              </div>
              <p className="mt-1">{c.text}</p>
              {c.replies.length > 0 && <p className="text-xs text-muted">{c.replies.length} repl{c.replies.length > 1 ? 'ies' : 'y'}</p>}
              <div className="mt-1 flex gap-1">
                <Btn kind="quiet" onClick={() => { ui.setFeedbackMode(true); ui.jumpTo(c.screen, c.elementId); }}>Jump to it</Btn>
                <Btn kind="quiet" onClick={() => setThread(c.id)}>Open</Btn>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="eyebrow mt-5">Feature requests ({features.length})</h3>
        <ul className="mt-2 space-y-2">
          {features.map(({ f, item }) => (
            <li key={f.id} className="rounded-xl border border-line bg-card p-3">
              <div className="font-medium">{item!.title}</div>
              {item!.description && <p className="text-sm">{item!.description}</p>}
              {f.why && <p className="text-sm text-muted">Why: {f.why}</p>}
              <ItemMeta i={item!} />
              <p className="mt-1 text-xs text-muted">On {ws.nodes.find((n) => n.id === item!.nodeId)?.label} · {prettyDateTime(f.createdAt)}</p>
              <Btn kind="quiet" className="-ml-2" onClick={() => { ui.setOverlay(null); ui.go('blueprint'); ui.setOpenNode(item!.nodeId); }}>Open on Blueprint</Btn>
            </li>
          ))}
        </ul>
      </Sheet>
      <Thread comment={thread ? ws.comments.find((c) => c.id === thread) ?? null : null} onClose={() => setThread(null)} />
    </>
  );
}
