import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Edge, Node } from '../types';
import { COL_W, NODE_H, NODE_W, PER_ROW, ROW_H, SECTIONS } from '../data/blueprintSeed';
import { IconFit, IconZoomIn, IconZoomOut } from '../components/Icons';

export interface Layout {
  pos: Record<string, { x: number; y: number }>;
  bands: Array<{ id: string; title: string; y: number; h: number }>;
  width: number;
  height: number;
}

/** Nodes flow in rows inside their section; sections stack top to bottom. */
export function layout(nodes: Node[]): Layout {
  const pos: Layout['pos'] = {};
  const bands: Layout['bands'] = [];
  let y = 0;
  let maxCols = 1;
  for (const s of SECTIONS) {
    const ns = nodes.filter((n) => n.section === s.id);
    const rows = Math.max(1, Math.ceil(ns.length / PER_ROW));
    maxCols = Math.max(maxCols, Math.min(PER_ROW, ns.length));
    ns.forEach((n, i) => (pos[n.id] = { x: 32 + (i % PER_ROW) * COL_W, y: y + 52 + Math.floor(i / PER_ROW) * ROW_H }));
    const h = 52 + rows * ROW_H - (ROW_H - NODE_H) + 28;
    bands.push({ id: s.id, title: s.title, y, h });
    y += h + 24;
  }
  return { pos, bands, width: 32 + maxCols * COL_W, height: y };
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const ac = { x: a.x + NODE_W / 2, y: a.y + NODE_H / 2 };
  const bc = { x: b.x + NODE_W / 2, y: b.y + NODE_H / 2 };
  if (Math.abs(a.y - b.y) < 4) {
    const fwd = b.x > a.x;
    const x1 = fwd ? a.x + NODE_W : a.x;
    const x2 = fwd ? b.x - 6 : b.x + NODE_W + 6;
    return `M${x1},${ac.y} L${x2},${bc.y}`;
  }
  const down = b.y > a.y;
  const y1 = down ? a.y + NODE_H : a.y;
  const y2 = down ? b.y - 6 : b.y + NODE_H + 6;
  const dy = (y2 - y1) / 2;
  return `M${ac.x},${y1} C${ac.x},${y1 + dy} ${bc.x},${y2 - dy} ${bc.x},${y2}`;
}

export function Board({ nodes, edges, openCounts, selected, arrowFrom, onNode }: { nodes: Node[]; edges: Edge[]; openCounts: Record<string, number>; selected?: string | null; arrowFrom?: string | null; onNode: (id: string) => void }) {
  const L = useMemo(() => layout(nodes), [nodes]);
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ s: 0.5, tx: 8, ty: 8 });
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; nodeId?: string; startDist?: number; startS?: number; mid?: { x: number; y: number }; startView?: typeof view; last?: { x: number; y: number } }>({ moved: false });

  const fit = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    const w = el.clientWidth;
    const s = Math.min(1, Math.max(0.15, (w - 16) / L.width));
    setView({ s, tx: (w - L.width * s) / 2, ty: 8 });
  }, [L.width]);

  useEffect(() => {
    fit();
    // fit once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomAt = (factor: number, cx: number, cy: number) =>
    setView((v) => {
      const s = Math.min(2.5, Math.max(0.2, v.s * factor));
      const k = s / v.s;
      return { s, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
    });

  const local = (e: { clientX: number; clientY: number }) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    const p = local(e);
    ptrs.current.set(e.pointerId, p);
    const g = gesture.current;
    if (ptrs.current.size === 1) {
      const nodeEl = (e.target as Element).closest('[data-node-id]');
      gesture.current = { moved: false, nodeId: nodeEl?.getAttribute('data-node-id') ?? undefined, last: p };
    } else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      g.moved = true;
      g.nodeId = undefined;
      g.startDist = Math.hypot(a.x - b.x, a.y - b.y);
      g.startS = view.s;
      g.mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      g.startView = view;
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return;
    const p = local(e);
    ptrs.current.set(e.pointerId, p);
    const g = gesture.current;
    if (ptrs.current.size === 2 && g.startDist && g.startView && g.mid) {
      const [a, b] = [...ptrs.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const v0 = g.startView;
      const s = Math.min(2.5, Math.max(0.2, v0.s * (dist / g.startDist)));
      const k = s / v0.s;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      setView({ s, tx: mid.x - (g.mid.x - v0.tx) * k, ty: mid.y - (g.mid.y - v0.ty) * k });
    } else if (ptrs.current.size === 1 && g.last) {
      const dx = p.x - g.last.x;
      const dy = p.y - g.last.y;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      if (!g.moved) (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      g.moved = true;
      g.last = p;
      setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
    }
  };

  const onUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId);
    const g = gesture.current;
    if (ptrs.current.size === 0) {
      if (!g.moved && g.nodeId && !document.body.classList.contains('feedback-on')) onNode(g.nodeId);
      gesture.current = { moved: false };
    } else if (ptrs.current.size === 1) {
      const [only] = [...ptrs.current.values()];
      gesture.current = { moved: true, last: only };
    }
  };

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const center = () => {
    const el = wrap.current!;
    return { x: el.clientWidth / 2, y: el.clientHeight / 2 };
  };

  return (
    <div className="relative">
      <div
        ref={wrap}
        className="h-[62vh] min-h-[360px] touch-none select-none overflow-hidden rounded-2xl border border-line bg-[#F4F1E8]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        data-feedback-id="bp-board"
      >
        <svg width="100%" height="100%" role="group" aria-label="Blueprint board">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#D8D2C2" />
            </pattern>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#5C6660" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <g transform={`translate(${view.tx},${view.ty}) scale(${view.s})`}>
            {L.bands.map((b) => (
              <g key={b.id}>
                <rect x={8} y={b.y} width={L.width + 8} height={b.h} rx={18} fill="#FFFFFF" fillOpacity={0.55} stroke="#D8D2C2" />
                <text x={28} y={b.y + 32} fontFamily="Outfit, sans-serif" fontSize={20} fontWeight={600} fill="#1F2421">
                  {b.title}
                </text>
              </g>
            ))}
            {edges.map((e) => {
              const a = L.pos[e.from];
              const b = L.pos[e.to];
              if (!a || !b) return null;
              return <path key={e.id} d={edgePath(a, b)} fill="none" stroke="#5C6660" strokeWidth={2} strokeDasharray={e.dashed ? '7 6' : undefined} markerEnd="url(#arrow)" />;
            })}
            {nodes.map((n) => {
              const p = L.pos[n.id];
              if (!p) return null;
              const hl = n.highlighted;
              const sel = selected === n.id || arrowFrom === n.id;
              const count = openCounts[n.id] ?? 0;
              return (
                <g
                  key={n.id}
                  data-node-id={n.id}
                  data-feedback-id={`bp-node-${n.id}`}
                  transform={`translate(${p.x},${p.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.label}${n.sublabel ? `, ${n.sublabel}` : ''}${count ? `, ${count} open items` : ''}`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onNode(n.id))}
                  style={{ cursor: 'pointer' }}
                >
                  <rect width={NODE_W} height={NODE_H} rx={12} fill={hl ? '#2F5D50' : '#FFFFFF'} stroke={sel ? '#C77C02' : hl ? '#23473D' : '#9C968A'} strokeWidth={sel ? 3.5 : 1.5} strokeDasharray={n.custom ? '5 4' : undefined} />
                  <text x={NODE_W / 2} y={n.sublabel ? 30 : 41} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={15} fontWeight={600} fill={hl ? '#FFFFFF' : '#1F2421'}>
                    {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
                  </text>
                  {n.sublabel && (
                    <text x={NODE_W / 2} y={50} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={11.5} fill={hl ? '#E6EEEB' : '#555D58'}>
                      {n.sublabel.length > 30 ? n.sublabel.slice(0, 29) + '…' : n.sublabel}
                    </text>
                  )}
                  {count > 0 && (
                    <g transform={`translate(${NODE_W - 4},4)`}>
                      <circle r={12} fill="#C77C02" />
                      <text textAnchor="middle" y={4.5} fontFamily="Inter, sans-serif" fontSize={12} fontWeight={700} fill="#FFFFFF">
                        {count}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1 rounded-xl border border-line bg-card p-1 shadow-sm" data-feedback-ui>
        <button type="button" className="tap" aria-label="Zoom in" onClick={() => { const c = center(); zoomAt(1.25, c.x, c.y); }}><IconZoomIn /></button>
        <button type="button" className="tap" aria-label="Zoom out" onClick={() => { const c = center(); zoomAt(0.8, c.x, c.y); }}><IconZoomOut /></button>
        <button type="button" className="tap" aria-label="Fit to screen" onClick={fit}><IconFit /></button>
      </div>
    </div>
  );
}
