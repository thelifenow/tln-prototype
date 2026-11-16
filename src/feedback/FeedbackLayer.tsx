import { useEffect, useState } from 'react';
import type { Comment, CommentType, ScreenId } from '../types';
import { useUi } from '../state/ui';
import { useWorkspace } from '../state/workspace';
import { Btn, Select, Sheet, inputCls } from '../components/ui';
import { prettyDateTime } from '../lib/dates';

export const COMMENT_TYPES: CommentType[] = ['Comment', 'Bug', 'Feature request', 'Question'];
export const SCREEN_LABEL: Record<ScreenId, string> = { slate: 'Slate', today: 'Today', season: 'Season', journal: 'Journal', blueprint: 'Blueprint' };

interface Draft {
  elementId: string;
  ox: number;
  oy: number;
}

function Composer({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const ui = useUi();
  const ws = useWorkspace();
  const [text, setText] = useState('');
  const [type, setType] = useState<CommentType>('Comment');
  useEffect(() => {
    setText('');
    setType('Comment');
  }, [draft?.elementId, draft?.ox]);
  if (!draft) return null;
  const n = ws.comments.reduce((m, c) => Math.max(m, c.number), 0) + 1;
  return (
    <Sheet open onClose={onClose} title={`Comment #${n}`}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          ws.addComment({ screen: ui.screen, elementId: draft.elementId, ox: draft.ox, oy: draft.oy, text: text.trim(), type });
          ui.say(`Comment #${n} pinned`);
          onClose();
        }}
      >
        <p className="text-sm text-muted">
          On {SCREEN_LABEL[ui.screen]} · <code className="rounded bg-[#ECE7DA] px-1 text-xs">{draft.elementId}</code>
        </p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Your comment</span>
          <textarea className={inputCls} rows={4} value={text} onChange={(e) => setText(e.target.value)} autoFocus required />
        </label>
        <Select label="Type" value={type} onChange={setType} options={COMMENT_TYPES} />
        <div className="flex gap-2">
          <Btn type="submit">Pin comment</Btn>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </form>
    </Sheet>
  );
}

export function Thread({ comment, onClose }: { comment: Comment | null; onClose: () => void }) {
  const ws = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  useEffect(() => {
    setEditing(false);
    setReply('');
    setText(comment?.text ?? '');
    // reset on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment?.id]);
  if (!comment) return null;
  const c = ws.comments.find((x) => x.id === comment.id) ?? comment;
  return (
    <Sheet open onClose={onClose} title={`Comment #${c.number}`}>
      <p className="text-sm text-muted">
        {SCREEN_LABEL[c.screen]} · <code className="rounded bg-[#ECE7DA] px-1 text-xs">{c.elementId}</code> · {prettyDateTime(c.createdAt)}
        {c.resolved && ' · resolved'}
      </p>
      {editing ? (
        <div className="mt-3 space-y-2">
          <label className="sr-only" htmlFor="edit-c">Edit comment</label>
          <textarea id="edit-c" className={inputCls} rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <Select label="Type" value={c.type} onChange={(v) => ws.updateComment(c.id, { type: v })} options={COMMENT_TYPES} />
          <div className="flex gap-2">
            <Btn onClick={() => { ws.updateComment(c.id, { text: text.trim() || c.text }); setEditing(false); }}>Save</Btn>
            <Btn kind="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <>
          <span className="mt-3 inline-block rounded bg-[#FDF0D5] px-2 py-0.5 text-xs font-semibold text-[#7A4A00]">{c.type}</span>
          <p className="mt-2 whitespace-pre-wrap text-base">{c.text}</p>
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {!editing && <Btn kind="quiet" onClick={() => setEditing(true)}>Edit</Btn>}
        <Btn kind="quiet" onClick={() => ws.updateComment(c.id, { resolved: !c.resolved })}>{c.resolved ? 'Reopen' : 'Resolve'}</Btn>
        <Btn kind="quiet" onClick={() => { if (window.confirm('Delete this comment?')) { ws.deleteComment(c.id); onClose(); } }}>Delete</Btn>
      </div>
      <h3 className="eyebrow mt-4">Replies ({c.replies.length})</h3>
      <ul className="mt-2 space-y-2">
        {c.replies.map((r) => (
          <li key={r.id} className="rounded-lg border border-line bg-card p-3 text-sm">
            <div className="text-xs text-muted">{prettyDateTime(r.createdAt)}</div>
            {r.text}
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (reply.trim()) {
            ws.addReply(c.id, reply.trim());
            setReply('');
          }
        }}
      >
        <label className="sr-only" htmlFor="reply">Reply</label>
        <input id="reply" className={inputCls} placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <Btn type="submit">Reply</Btn>
      </form>
    </Sheet>
  );
}

/** Pins numbered markers on elements and captures taps while Feedback mode is on. */
export function FeedbackLayer() {
  const ui = useUi();
  const ws = useWorkspace();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [thread, setThread] = useState<Comment | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    document.body.classList.toggle('feedback-on', ui.feedbackMode);
  }, [ui.feedbackMode]);

  // Capture taps on any element while in feedback mode.
  useEffect(() => {
    if (!ui.feedbackMode) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || t.closest('[data-feedback-ui]') || t.closest('[data-feedback-marker]')) return;
      const el = t.closest('[data-feedback-id]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const r = el.getBoundingClientRect();
      const ox = r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0.5;
      const oy = r.height ? Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) : 0.5;
      setDraft({ elementId: el.getAttribute('data-feedback-id')!, ox, oy });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [ui.feedbackMode]);

  // Keep markers glued to their elements.
  useEffect(() => {
    if (!ui.feedbackMode) return;
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last > 120) {
        last = ts;
        setTick((x) => x + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ui.feedbackMode]);

  // Flash an element after a jump.
  useEffect(() => {
    if (!ui.flash) return;
    const id = window.setTimeout(() => {
      const el = document.querySelector(`[data-feedback-id="${CSS.escape(ui.flash!)}"]`);
      el?.classList.add('flash');
      window.setTimeout(() => el?.classList.remove('flash'), 2300);
    }, 120);
    return () => window.clearTimeout(id);
  }, [ui.flash]);

  const here = ui.feedbackMode ? ws.comments.filter((c) => c.screen === ui.screen) : [];

  return (
    <>
      {here.map((c) => {
        const el = document.querySelector(`[data-feedback-id="${CSS.escape(c.elementId)}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return null;
        const x = r.left + c.ox * r.width;
        const y = r.top + c.oy * r.height;
        if (y < 56 || y > window.innerHeight - 60) return null;
        return (
          <button
            key={c.id}
            type="button"
            data-feedback-marker
            onClick={() => setThread(c)}
            aria-label={`Comment ${c.number}: ${c.text}`}
            style={{ left: x - 16, top: y - 16 }}
            className={`fixed z-[35] flex h-8 w-8 items-center justify-center rounded-full rounded-bl-none border-2 border-white text-sm font-bold shadow-md ${c.resolved ? 'bg-[#8C877C] text-white' : 'bg-[#9A5B00] text-white'}`}
          >
            {c.number}
          </button>
        );
      })}
      <Composer draft={draft} onClose={() => setDraft(null)} />
      <Thread comment={thread} onClose={() => setThread(null)} />
    </>
  );
}
