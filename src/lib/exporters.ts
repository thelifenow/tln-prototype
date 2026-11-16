import type { Item, Priority, Workspace, WorkspaceExport } from '../types';
import { SECTIONS } from '../data/blueprintSeed';
import { nowIso } from './id';

export const PRIORITY_ORDER: Priority[] = ['Must', 'Should', 'Could', "Won't for now"];
export const byPriority = (a: Item, b: Item) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);

const SCREEN_NAMES: Record<string, string> = { slate: 'Slate', today: 'Today', season: 'Season', journal: 'Journal', blueprint: 'Blueprint' };

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

export function toExport(ws: Workspace): WorkspaceExport {
  return { app: 'tln-prototype', version: 1, exportedAt: nowIso(), nodes: ws.nodes, edges: ws.edges, items: ws.items, comments: ws.comments, featureRequests: ws.featureRequests };
}

export function exportJson(ws: Workspace) {
  download(`tln-blueprint-${stamp()}.json`, JSON.stringify(toExport(ws), null, 2), 'application/json');
}

export function toMarkdown(ws: Workspace): string {
  const L: string[] = [];
  const d = (iso: string) => iso.slice(0, 10);
  L.push('# The Life NOW: requirements', '', `Exported ${new Date().toLocaleString()} from the Blank Slate prototype.`, '');
  const counts = { items: ws.items.length, mvp: ws.items.filter((i) => i.release === 'MVP').length, q: ws.items.filter((i) => i.type === 'Question' && i.status !== 'Dropped').length };
  L.push(`${counts.items} items · ${counts.mvp} for MVP · ${counts.q} open questions · ${ws.comments.length} comments`, '');

  for (const s of SECTIONS) {
    const nodes = ws.nodes.filter((n) => n.section === s.id);
    if (!nodes.length) continue;
    L.push(`## ${s.title}`, '');
    for (const n of nodes) {
      const items = ws.items.filter((i) => i.nodeId === n.id).sort(byPriority);
      const links = ws.edges
        .filter((e) => e.from === n.id || e.to === n.id)
        .map((e) => (e.from === n.id ? `→ ${ws.nodes.find((x) => x.id === e.to)?.label}` : `← ${ws.nodes.find((x) => x.id === e.from)?.label}`));
      L.push(`### ${n.label}${n.sublabel ? ` (${n.sublabel})` : ''}`, '');
      L.push(n.description, '');
      if (n.behavior) L.push(`*Prototype:* ${n.behavior}`, '');
      if (links.length) L.push(`*Linked:* ${links.join(', ')}`, '');
      if (items.length) {
        for (const i of items) {
          const fr = ws.featureRequests.find((f) => f.itemId === i.id);
          L.push(`- **${i.title}** · ${i.type} · ${i.priority} · ${i.release} · ${i.status}${fr ? ' · from Feedback' : ''}`);
          if (i.description) L.push(`  ${i.description.replace(/\n/g, '\n  ')}`);
          if (fr?.why) L.push(`  *Why:* ${fr.why}`);
        }
        L.push('');
      }
      if (n.notes.trim()) L.push(`> Notes: ${n.notes.trim().replace(/\n/g, '\n> ')}`, '');
    }
  }

  L.push('## Comments by screen', '');
  if (!ws.comments.length) L.push('_No comments yet._', '');
  for (const sc of Object.keys(SCREEN_NAMES)) {
    const cs = ws.comments.filter((c) => c.screen === sc).sort((a, b) => a.number - b.number);
    if (!cs.length) continue;
    L.push(`### ${SCREEN_NAMES[sc]}`, '');
    for (const c of cs) {
      L.push(`- #${c.number} [${c.type}]${c.resolved ? ' (resolved)' : ''} on \`${c.elementId}\`, ${d(c.createdAt)}: ${c.text}`);
      for (const r of c.replies) L.push(`  - Reply, ${d(r.createdAt)}: ${r.text}`);
    }
    L.push('');
  }
  return L.join('\n');
}

export function exportMarkdown(ws: Workspace) {
  download(`tln-requirements-${stamp()}.md`, toMarkdown(ws), 'text/markdown');
}

export function parseImport(text: string): WorkspaceExport {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !Array.isArray(data.nodes)) throw new Error('This file is not a TLN prototype export.');
  return data as WorkspaceExport;
}
