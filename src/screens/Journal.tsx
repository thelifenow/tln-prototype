import { useState } from 'react';
import { useDemo } from '../state/demo';
import { useUi } from '../state/ui';
import { prettyDateTime } from '../lib/dates';
import { highlight } from '../lib/highlight';
import { EntryMachinery } from '../underfloor/Machinery';

const CLASS_LABEL = { journal: 'Journal', planning: 'Planning', both: 'Journal + planning' };
const MODE_LABEL = { typed: 'Typed', voice: 'Voice note', photo: 'Photo of a page' };

export function Journal() {
  const demo = useDemo();
  const ui = useUi();
  const [active, setActive] = useState<{ entry: string; source?: string } | null>(null);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Journal</h1>
      <p className="text-sm text-muted">Every entry, kept exactly as you wrote it.</p>
      {demo.entries.length === 0 && (
        <div className="card mt-5 p-6 text-center text-muted" data-feedback-id="journal-empty">
          Nothing here yet. Write on the Slate, or try a sample entry.
        </div>
      )}
      <ol className="mt-4 space-y-4">
        {demo.entries.map((e) => {
          const src = active?.entry === e.id ? active.source : undefined;
          return (
            <li key={e.id} data-feedback-id={`entry-${e.id}`}>
              <article className="card p-4" aria-label={`Entry from ${prettyDateTime(e.createdAt)}`}>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <time dateTime={e.createdAt}>{prettyDateTime(e.createdAt)}</time>
                  <span>·</span>
                  <span>{MODE_LABEL[e.mode]}</span>
                  <span>·</span>
                  <span>{e.mapping.care ? 'Journal' : CLASS_LABEL[e.mapping.classification.value]}</span>
                </div>
                {e.imageDataUrl && <img src={e.imageDataUrl} alt="Photo of the handwritten page" className="mt-3 max-h-48 rounded-lg border border-line object-contain" />}
                {e.hasAudio && demo.audio[e.id] && <audio controls src={demo.audio[e.id]} className="mt-3 w-full" aria-label="Voice note" />}
                <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{highlight(e.rawText, src)}</p>
                {e.mapping.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Mapped from this entry">
                    {e.mapping.links.map((l, i) => {
                      const on = active?.entry === e.id && active.source === l.source;
                      return (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setActive(on ? null : { entry: e.id, source: l.source })}
                          className={`min-h-[36px] rounded-full border px-3 text-xs font-medium ${on ? 'border-accent bg-accent text-white' : 'border-accent/40 bg-accent-soft text-accent-ink'}`}
                          data-feedback-id={`entry-chip-${e.id}-${i}`}
                        >
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {e.mapping.proposals.some((p) => p.status === 'pending') && (
                  <p className="mt-2 text-xs text-muted">Waiting on your answer: still a draft.</p>
                )}
              </article>
              {ui.underFloor && <EntryMachinery title={`entry ${e.id}`} mapping={e.mapping} rawText={e.rawText} mode={e.mode} transcriptSource={e.transcriptSource} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
