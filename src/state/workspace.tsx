import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Comment, Edge, FeatureRequest, Item, Node, Reply, Workspace, WorkspaceExport } from '../types';
import { seedEdges, seedNodes } from '../data/blueprintSeed';
import { KEYS, load, save } from '../lib/storage';
import { nowIso, uid } from '../lib/id';

const fresh = (): Workspace => ({ nodes: seedNodes(), edges: seedEdges(), items: [], comments: [], featureRequests: [] });

type ItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

interface WorkspaceApi extends Workspace {
  addNode: (n: Pick<Node, 'section' | 'label' | 'description' | 'x' | 'y'>) => Node;
  updateNode: (id: string, patch: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  addEdge: (from: string, to: string) => void;
  deleteEdge: (id: string) => void;
  addItem: (i: ItemInput) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addComment: (c: Omit<Comment, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'replies' | 'resolved'>) => Comment;
  updateComment: (id: string, patch: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
  addReply: (commentId: string, text: string) => void;
  addFeature: (input: { item: ItemInput; why: string; screen?: FeatureRequest['screen'] }) => void;
  updateFeature: (id: string, patch: Partial<FeatureRequest>) => void;
  clearBlueprint: () => void;
  clearFeedback: () => void;
  importData: (data: WorkspaceExport) => { added: number; updated: number };
}

const Ctx = createContext<WorkspaceApi | null>(null);

function mergeById<T extends { id: string; updatedAt: string }>(mine: T[], theirs: T[] | undefined, stat: { added: number; updated: number }): T[] {
  const map = new Map(mine.map((x) => [x.id, x]));
  for (const t of theirs ?? []) {
    if (!t || typeof t.id !== 'string') continue;
    const m = map.get(t.id);
    if (!m) {
      map.set(t.id, t);
      stat.added++;
    } else if ((t.updatedAt ?? '') > (m.updatedAt ?? '')) {
      map.set(t.id, t);
      stat.updated++;
    }
  }
  return [...map.values()];
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<Workspace>(() => {
    const s = load<Workspace | null>(KEYS.workspace, null);
    return s && Array.isArray(s.nodes) ? { ...fresh(), ...s } : fresh();
  });
  const ref = useRef(ws);
  ref.current = ws;
  useEffect(() => {
    save(KEYS.workspace, ws);
  }, [ws]);

  const patchList = <K extends keyof Workspace>(key: K, id: string, patch: object) =>
    setWs((w) => ({ ...w, [key]: (w[key] as Array<{ id: string }>).map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x)) }));

  const addNode = useCallback<WorkspaceApi['addNode']>((n) => {
    const node: Node = { ...n, id: uid('n'), behavior: 'Added by the author in Blueprint.', notes: '', custom: true, createdAt: nowIso(), updatedAt: nowIso() };
    setWs((w) => ({ ...w, nodes: [...w.nodes, node] }));
    return node;
  }, []);

  const updateNode = useCallback((id: string, patch: Partial<Node>) => patchList('nodes', id, patch), []);
  const deleteNode = useCallback((id: string) => setWs((w) => ({ ...w, nodes: w.nodes.filter((n) => n.id !== id), edges: w.edges.filter((e) => e.from !== id && e.to !== id) })), []);

  const addEdge = useCallback((from: string, to: string) => {
    if (from === to) return;
    setWs((w) => (w.edges.some((e) => e.from === from && e.to === to) ? w : { ...w, edges: [...w.edges, { id: uid('e'), from, to, createdAt: nowIso(), updatedAt: nowIso() } as Edge] }));
  }, []);
  const deleteEdge = useCallback((id: string) => setWs((w) => ({ ...w, edges: w.edges.filter((e) => e.id !== id) })), []);

  const addItem = useCallback((i: ItemInput) => {
    const item: Item = { ...i, id: uid('item'), createdAt: nowIso(), updatedAt: nowIso() };
    setWs((w) => ({ ...w, items: [...w.items, item] }));
    return item;
  }, []);
  const updateItem = useCallback((id: string, patch: Partial<Item>) => patchList('items', id, patch), []);
  const deleteItem = useCallback(
    (id: string) => setWs((w) => ({ ...w, items: w.items.filter((x) => x.id !== id), featureRequests: w.featureRequests.filter((f) => f.itemId !== id) })),
    [],
  );

  const addComment = useCallback<WorkspaceApi['addComment']>((c) => {
    const number = ref.current.comments.reduce((m, x) => Math.max(m, x.number), 0) + 1;
    const created: Comment = { ...c, id: uid('c'), number, replies: [], resolved: false, createdAt: nowIso(), updatedAt: nowIso() };
    setWs((w) => ({ ...w, comments: [...w.comments, created] }));
    return created;
  }, []);
  const updateComment = useCallback((id: string, patch: Partial<Comment>) => patchList('comments', id, patch), []);
  const deleteComment = useCallback((id: string) => setWs((w) => ({ ...w, comments: w.comments.filter((c) => c.id !== id) })), []);
  const addReply = useCallback((commentId: string, text: string) => {
    const r: Reply = { id: uid('r'), text, createdAt: nowIso() };
    setWs((w) => ({ ...w, comments: w.comments.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, r], updatedAt: nowIso() } : c)) }));
  }, []);

  const addFeature = useCallback<WorkspaceApi['addFeature']>(({ item, why, screen }) => {
    const itemId = uid('item');
    const frId = uid('fr');
    const t = nowIso();
    setWs((w) => ({
      ...w,
      items: [...w.items, { ...item, id: itemId, featureRequestId: frId, createdAt: t, updatedAt: t }],
      featureRequests: [...w.featureRequests, { id: frId, itemId, why, screen, createdAt: t, updatedAt: t }],
    }));
  }, []);
  const updateFeature = useCallback((id: string, patch: Partial<FeatureRequest>) => patchList('featureRequests', id, patch), []);

  const clearBlueprint = useCallback(() => setWs((w) => ({ ...fresh(), comments: w.comments })), []);
  const clearFeedback = useCallback(
    () =>
      setWs((w) => {
        const frItems = new Set(w.featureRequests.map((f) => f.itemId));
        return { ...w, comments: [], featureRequests: [], items: w.items.filter((i) => !frItems.has(i.id)) };
      }),
    [],
  );

  const importData = useCallback((data: WorkspaceExport) => {
    const stat = { added: 0, updated: 0 };
    const w = ref.current;
    const next: Workspace = {
      nodes: mergeById(w.nodes, data.nodes, stat),
      edges: mergeById(w.edges, data.edges, stat),
      items: mergeById(w.items, data.items, stat),
      comments: mergeById(w.comments, data.comments, stat),
      featureRequests: mergeById(w.featureRequests, data.featureRequests, stat),
    };
    ref.current = next;
    setWs(next);
    return stat;
  }, []);

  const api = useMemo<WorkspaceApi>(
    () => ({ ...ws, addNode, updateNode, deleteNode, addEdge, deleteEdge, addItem, updateItem, deleteItem, addComment, updateComment, deleteComment, addReply, addFeature, updateFeature, clearBlueprint, clearFeedback, importData }),
    [ws, addNode, updateNode, deleteNode, addEdge, deleteEdge, addItem, updateItem, deleteItem, addComment, updateComment, deleteComment, addReply, addFeature, updateFeature, clearBlueprint, clearFeedback, importData],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useWorkspace outside provider');
  return c;
}

/** Items still open (not Built or Dropped). */
export const isOpen = (i: Item) => i.status !== 'Built' && i.status !== 'Dropped';
