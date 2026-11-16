import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ScreenId, ShowMe } from '../types';
import { KEYS, load, save } from '../lib/storage';

export type Overlay = null | 'feedback-panel' | 'feature-form' | 'menu' | 'data';

interface UiApi {
  screen: ScreenId;
  go: (s: ScreenId) => void;
  underFloor: boolean;
  setUnderFloor: (v: boolean) => void;
  feedbackMode: boolean;
  setFeedbackMode: (v: boolean) => void;
  overlay: Overlay;
  setOverlay: (o: Overlay) => void;
  /** A scenario to preload on the Slate (from "Show me" or a chip). */
  preload: string | null;
  setPreload: (id: string | null) => void;
  showMe: (s: ShowMe) => void;
  /** Flash an element with this data-feedback-id after navigation. */
  flash: string | null;
  jumpTo: (screen: ScreenId, elementId: string) => void;
  /** Blueprint node to open after navigation. */
  openNode: string | null;
  setOpenNode: (id: string | null) => void;
  sabbathPreview: boolean;
  setSabbathPreview: (v: boolean) => void;
  toast: string | null;
  say: (msg: string) => void;
}

const Ctx = createContext<UiApi | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const initial = load<{ screen?: ScreenId; underFloor?: boolean }>(KEYS.ui, {});
  const [screen, setScreen] = useState<ScreenId>(initial.screen ?? 'slate');
  const [underFloor, setUnderFloor] = useState<boolean>(initial.underFloor ?? false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [preload, setPreload] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [openNode, setOpenNode] = useState<string | null>(null);
  const [sabbathPreview, setSabbathPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    save(KEYS.ui, { screen, underFloor });
  }, [screen, underFloor]);

  const go = useCallback((s: ScreenId) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);

  const showMe = useCallback(
    (s: ShowMe) => {
      setOverlay(null);
      if (s.underFloor !== undefined) setUnderFloor(s.underFloor);
      if (s.scenarioId) setPreload(s.scenarioId);
      go(s.screen);
    },
    [go],
  );

  const jumpTo = useCallback(
    (s: ScreenId, elementId: string) => {
      setOverlay(null);
      go(s);
      setFlash(elementId);
      window.setTimeout(() => {
        const el = document.querySelector(`[data-feedback-id="${CSS.escape(elementId)}"]`);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 80);
      window.setTimeout(() => setFlash(null), 2200);
    },
    [go],
  );

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  const api = useMemo(
    () => ({ screen, go, underFloor, setUnderFloor, feedbackMode, setFeedbackMode, overlay, setOverlay, preload, setPreload, showMe, flash, jumpTo, openNode, setOpenNode, sabbathPreview, setSabbathPreview, toast, say }),
    [screen, go, underFloor, feedbackMode, overlay, preload, showMe, flash, jumpTo, openNode, sabbathPreview, toast, say],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useUi() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUi outside provider');
  return c;
}
