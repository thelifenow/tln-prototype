import { useRef, useState } from 'react';
import { useUi } from '../state/ui';
import { useWorkspace } from '../state/workspace';
import { exportJson, exportMarkdown, parseImport } from '../lib/exporters';
import { Btn, Sheet } from './ui';
import { IconDownload, IconUpload } from './Icons';

export function DataSheet() {
  const ui = useUi();
  const ws = useWorkspace();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onImport = async (f?: File) => {
    if (!f) return;
    try {
      const data = parseImport(await f.text());
      const r = ws.importData(data);
      setMsg(`Imported: ${r.added} new, ${r.updated} updated (newer edit kept).`);
    } catch (e) {
      setMsg(e instanceof Error ? `Could not import: ${e.message}` : 'Could not import that file.');
    }
  };

  return (
    <Sheet open={ui.overlay === 'data'} onClose={() => { ui.setOverlay(null); setMsg(null); }} title="Export · Import · Clear">
      <p className="text-sm text-muted">
        {ws.nodes.length} nodes · {ws.edges.length} arrows · {ws.items.length} items · {ws.comments.length} comments · {ws.featureRequests.length} feature requests
      </p>
      <h3 className="eyebrow mt-4">Export</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn onClick={() => exportJson(ws)}><IconDownload size={18} /> JSON (everything)</Btn>
        <Btn kind="ghost" onClick={() => exportMarkdown(ws)}><IconDownload size={18} /> Markdown requirements</Btn>
      </div>
      <h3 className="eyebrow mt-5">Import</h3>
      <p className="mt-1 text-sm text-muted">Load a JSON export from another device or a reviewer. Records merge by id; the newer edit wins.</p>
      <Btn kind="ghost" className="mt-2" onClick={() => file.current?.click()}><IconUpload size={18} /> Choose JSON file</Btn>
      <input ref={file} type="file" accept="application/json,.json" className="sr-only" aria-label="Import JSON file" onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
      {msg && <p className="mt-2 text-sm font-medium" role="status">{msg}</p>}
      <h3 className="eyebrow mt-5">Clear</h3>
      <p className="mt-1 text-sm text-muted">"Reset demo" never touches these. Export first if you want a copy.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn kind="danger" onClick={() => window.confirm('Clear Blueprint? Nodes and arrows go back to the original board, and all requirement items are deleted. Comments are kept.') && (ws.clearBlueprint(), setMsg('Blueprint cleared.'))}>Clear Blueprint</Btn>
        <Btn kind="danger" onClick={() => window.confirm('Clear Feedback? All comments and feature requests (and their Blueprint items) are deleted.') && (ws.clearFeedback(), setMsg('Feedback cleared.'))}>Clear Feedback</Btn>
      </div>
    </Sheet>
  );
}
