import type { Entry } from '../types';
import { useDemo } from '../state/demo';
import { useUi } from '../state/ui';
import { Btn } from '../components/ui';
import { IconCheck } from '../components/Icons';

export function ResponseCard({ entry }: { entry: Entry }) {
  const demo = useDemo();
  const ui = useUi();
  const m = entry.mapping;
  const qs = m.proposals.slice(0, 2);

  if (m.care) {
    return (
      <section className="card mt-5 border-accent/40 p-5" aria-live="polite" data-feedback-id="response-card">
        <p className="font-heading text-xl font-medium">{m.heard}</p>
        <p className="mt-3 text-base leading-relaxed">{m.oneRightAction.text}</p>
        <p className="mt-3 text-sm text-muted">Your words are kept safe in your journal. Planning can wait.</p>
      </section>
    );
  }

  return (
    <section className="card mt-5 p-5" aria-live="polite" aria-label="What I heard" data-feedback-id="response-card">
      <p className="text-sm text-muted">Saved to your journal, just as you wrote it.</p>
      <p className="mt-2 font-heading text-xl font-medium leading-snug" data-feedback-id="response-heard">{m.heard}</p>

      <div className="mt-4 rounded-xl bg-accent-soft p-4" data-feedback-id="response-right-action">
        <div className="eyebrow text-accent-ink">One right action for now</div>
        <p className="mt-1 text-lg font-medium text-accent-ink">{m.oneRightAction.text}</p>
      </div>

      {m.autoSummary.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {m.autoSummary.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <IconCheck size={18} className="text-accent" /> {s}
            </li>
          ))}
        </ul>
      )}

      {qs.length > 0 && (
        <div className="mt-4 space-y-3" data-feedback-id="response-questions">
          {qs.map((p) => (
            <div key={p.id} className="border-t border-line pt-3">
              <p className="text-base">{p.question}</p>
              {p.status === 'pending' ? (
                <div className="mt-2 flex gap-2">
                  <Btn onClick={() => demo.answer(entry.id, p.id, true)}>Yes</Btn>
                  <Btn kind="ghost" onClick={() => demo.answer(entry.id, p.id, false)}>
                    Not now
                  </Btn>
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-accent-ink">{p.status === 'yes' ? 'Done. It’s in place.' : 'Okay. Kept as a draft, nothing changed.'}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
        <Btn kind="quiet" onClick={() => ui.go('today')}>See Today</Btn>
        <Btn kind="quiet" onClick={() => ui.go('season')}>See Season</Btn>
        <Btn kind="quiet" onClick={() => ui.go('journal')}>See Journal</Btn>
      </div>
    </section>
  );
}
