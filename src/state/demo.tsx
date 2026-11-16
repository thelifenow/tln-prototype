import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CaptureMode, CoreKey, Entry, Planning } from '../types';
import { seedPlanning } from '../data/seed';
import { KEYS, load, save } from '../lib/storage';
import { uid, nowIso } from '../lib/id';
import { answerProposal, applyActions, mapEntry } from '../engine/apply';

interface DemoState {
  planning: Planning;
  entries: Entry[];
}

interface DemoApi extends DemoState {
  saveEntry: (input: { text: string; mode: CaptureMode; transcriptSource?: Entry['transcriptSource']; imageDataUrl?: string; hasAudio?: boolean }) => Entry;
  answer: (entryId: string, proposalId: string, yes: boolean) => void;
  toggleDo: (doId: string) => void;
  setCore: (date: string, key: CoreKey, kept: boolean) => void;
  reset: () => void;
  /** In-memory audio clips (not persisted). */
  audio: Record<string, string>;
  setAudio: (entryId: string, url: string) => void;
}

const Ctx = createContext<DemoApi | null>(null);

const fresh = (): DemoState => ({ planning: seedPlanning(), entries: [] });

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => {
    const s = load<DemoState | null>(KEYS.demo, null);
    return s && s.planning && Array.isArray(s.entries) ? s : fresh();
  });
  const [audio, setAudioMap] = useState<Record<string, string>>({});
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    save(KEYS.demo, state);
  }, [state]);

  const saveEntry: DemoApi['saveEntry'] = useCallback((input) => {
    const id = uid('entry');
    const cur = ref.current;
    const mapping = mapEntry(input.text, cur.planning, id);
    const created: Entry = { id, createdAt: nowIso(), mode: input.mode, rawText: input.text, transcriptSource: input.transcriptSource, imageDataUrl: input.imageDataUrl, hasAudio: input.hasAudio, mapping };
    const next = { planning: applyActions(cur.planning, mapping.autoActions), entries: [created, ...cur.entries] };
    ref.current = next;
    setState(next);
    return created;
  }, []);

  const answer = useCallback((entryId: string, proposalId: string, yes: boolean) => {
    setState((s) => {
      const e = s.entries.find((x) => x.id === entryId);
      const pr = e?.mapping.proposals.find((p) => p.id === proposalId);
      if (!e || !pr || pr.status !== 'pending') return s;
      return {
        planning: yes ? applyActions(s.planning, pr.actions) : s.planning,
        entries: s.entries.map((x) => (x.id === entryId ? answerProposal(x, proposalId, yes) : x)),
      };
    });
  }, []);

  const toggleDo = useCallback((doId: string) => {
    setState((s) => ({ ...s, planning: { ...s.planning, dos: s.planning.dos.map((d) => (d.id === doId ? { ...d, done: !d.done } : d)) } }));
  }, []);

  const setCore = useCallback((date: string, key: CoreKey, kept: boolean) => {
    setState((s) => ({ ...s, planning: applyActions(s.planning, [{ kind: 'core', date, key, kept }]) }));
  }, []);

  const reset = useCallback(() => {
    setState(fresh());
    setAudioMap({});
  }, []);

  const setAudio = useCallback((entryId: string, url: string) => setAudioMap((a) => ({ ...a, [entryId]: url })), []);

  const api = useMemo(() => ({ ...state, saveEntry, answer, toggleDo, setCore, reset, audio, setAudio }), [state, saveEntry, answer, toggleDo, setCore, reset, audio, setAudio]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDemo outside provider');
  return c;
}
