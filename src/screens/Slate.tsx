import { useEffect, useMemo, useRef, useState } from 'react';
import type { CaptureMode, Entry } from '../types';
import { useDemo } from '../state/demo';
import { useUi } from '../state/ui';
import { SCENARIOS, scenarioById } from '../data/scenarios';
import { handwritingImage } from '../data/handwriting';
import { mapEntry } from '../engine/apply';
import { Chip, Btn } from '../components/ui';
import { IconCamera, IconMic, IconStop } from '../components/Icons';
import { EntryMachinery } from '../underfloor/Machinery';
import { ResponseCard } from './ResponseCard';

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;
const SpeechRecognition: SR = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;
const VOICE_TEXT = scenarioById('voice')!.text;
const PHOTO_TEXT = scenarioById('photo')!.text;

async function downscale(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function Slate() {
  const demo = useDemo();
  const ui = useUi();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<CaptureMode>('typed');
  const [image, setImage] = useState<string | undefined>();
  const [reading, setReading] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | undefined>();
  const [simClip, setSimClip] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState<Entry['transcriptSource']>();
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const recRef = useRef<{ mr?: MediaRecorder; sr?: SR; stream?: MediaStream; chunks: Blob[]; transcript: string }>({ chunks: [], transcript: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const clear = () => {
    setText('');
    setMode('typed');
    setImage(undefined);
    setClipUrl(undefined);
    setSimClip(false);
    setTranscriptSource(undefined);
    setActiveChip(null);
    setNotice(null);
  };

  const loadScenario = (id: string) => {
    const sc = scenarioById(id);
    if (!sc) return;
    clear();
    setActiveChip(id);
    setLastId(null);
    setMode(sc.mode);
    if (sc.mode === 'photo') {
      setImage(handwritingImage());
      setTranscriptSource('handwriting-scripted');
      setReading(true);
      window.setTimeout(() => {
        setReading(false);
        setText(sc.text);
      }, 700);
    } else {
      setText(sc.text);
      if (sc.mode === 'voice') {
        setSimClip(true);
        setTranscriptSource('scripted');
      }
    }
  };

  useEffect(() => {
    if (ui.preload) {
      loadScenario(ui.preload);
      ui.setPreload(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.preload]);

  /* ----------------------------- Voice ----------------------------- */
  const startRecording = async () => {
    setNotice(null);
    setLastId(null);
    setActiveChip(null);
    recRef.current = { chunks: [], transcript: '' };
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size && recRef.current.chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(recRef.current.chunks, { type: mr.mimeType || 'audio/webm' });
        setClipUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current.mr = mr;
      recRef.current.stream = stream;
      if (SpeechRecognition) {
        try {
          const sr = new SpeechRecognition();
          sr.continuous = true;
          sr.interimResults = false;
          sr.lang = navigator.language || 'en-US';
          sr.onresult = (ev: any) => {
            let s = '';
            for (let i = 0; i < ev.results.length; i++) if (ev.results[i].isFinal) s += ev.results[i][0].transcript + ' ';
            recRef.current.transcript = s.trim();
          };
          sr.onerror = () => {};
          sr.start();
          recRef.current.sr = sr;
        } catch {
          /* speech not available */
        }
      }
      setMode('voice');
      setRecording(true);
    } catch {
      setMode('voice');
      setSimClip(true);
      setText(VOICE_TEXT);
      setTranscriptSource('scripted');
      setNotice('The microphone is not available here, so a sample voice note was used.');
    }
  };

  const stopRecording = () => {
    const r = recRef.current;
    try { r.sr?.stop(); } catch { /* ignore */ }
    r.mr?.state === 'recording' && r.mr.stop();
    setRecording(false);
    window.setTimeout(() => {
      const t = recRef.current.transcript;
      if (t) {
        setText((prev) => (prev ? `${prev} ${t}` : t));
        setTranscriptSource('web-speech');
      } else {
        setText((prev) => prev || VOICE_TEXT);
        setTranscriptSource('scripted');
        if (!SpeechRecognition) setNotice('This browser can’t turn speech into text, so a sample transcript was used.');
      }
    }, 450);
  };

  /* ----------------------------- Photo ----------------------------- */
  const onPhoto = async (file?: File) => {
    if (!file) return;
    setLastId(null);
    setActiveChip(null);
    setMode('photo');
    setReading(true);
    try {
      setImage(await downscale(file));
    } catch {
      setImage(undefined);
    }
    setTranscriptSource('handwriting-scripted');
    window.setTimeout(() => {
      setReading(false);
      setText(PHOTO_TEXT);
    }, 900);
  };

  /* ----------------------------- Save ------------------------------ */
  const onSave = () => {
    if (!text.trim()) return;
    const e = demo.saveEntry({ text: text.trim(), mode, transcriptSource, imageDataUrl: image, hasAudio: !!clipUrl });
    if (clipUrl) demo.setAudio(e.id, clipUrl);
    clear();
    setLastId(e.id);
    window.setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const preview = useMemo(() => (ui.underFloor && text.trim() ? mapEntry(text.trim(), demo.planning, 'preview') : null), [ui.underFloor, text, demo.planning]);
  const last = demo.entries.find((e) => e.id === lastId);

  return (
    <div>
      <h1 className="sr-only">Blank Slate</h1>
      <div className="card p-4 sm:p-6" data-feedback-id="slate-page">
        <label htmlFor="slate" className="block font-heading text-2xl font-medium text-ink">
          Pour out your heart.
        </label>
        {(mode === 'voice' || mode === 'photo') && (
          <div className="mt-3 space-y-2" data-feedback-id="slate-capture">
            {image && <img src={image} alt="Photo of your handwritten page" className="max-h-56 w-full rounded-lg border border-line object-contain bg-paper" />}
            {reading && <p className="text-sm text-muted" role="status">Reading your handwriting…</p>}
            {mode === 'photo' && !reading && text && <p className="text-sm text-muted">Read from your handwriting. You can fix anything below.</p>}
            {clipUrl && <audio controls src={clipUrl} className="w-full" aria-label="Your voice note" />}
            {simClip && !clipUrl && <p className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-muted">Sample voice note, 0:21 (simulated, no audio)</p>}
            {mode === 'voice' && text && !recording && <p className="text-sm text-muted">From your voice note. You can fix anything below.</p>}
          </div>
        )}
        <textarea
          id="slate"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (lastId) setLastId(null);
          }}
          rows={9}
          placeholder="Write anything: what happened, what you feel, what needs doing."
          className="mt-3 min-h-[38vh] w-full resize-y rounded-xl border-0 bg-transparent p-1 text-lg leading-relaxed text-ink placeholder:text-[#77706A] focus:outline-none focus-visible:outline-none"
          data-feedback-id="slate-text"
        />
        {notice && <p className="mb-2 text-sm text-muted" role="status">{notice}</p>}
        {recording && (
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#8A2D20]" role="status">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#B3261E]" /> Listening…
          </p>
        )}
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            aria-label={recording ? 'Stop recording' : 'Record a voice note'}
            aria-pressed={recording}
            data-feedback-id="slate-mic"
            className={`tap h-12 w-12 rounded-full border ${recording ? 'border-[#B3261E] bg-[#FBEAEA] text-[#B3261E]' : 'border-line bg-paper text-ink'}`}
          >
            {recording ? <IconStop /> : <IconMic />}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add a photo of a handwritten page" data-feedback-id="slate-photo" className="tap h-12 w-12 rounded-full border border-line bg-paper text-ink">
            <IconCamera />
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          {text && (
            <button type="button" className="tap px-3 text-sm text-muted" onClick={clear}>
              Clear
            </button>
          )}
          <div className="flex-1" />
          <Btn onClick={onSave} disabled={!text.trim() || recording || reading} fid="slate-save" className="h-12 px-6 text-base">
            Save
          </Btn>
        </div>
      </div>

      <div className="mt-5" data-feedback-id="slate-samples">
        <h2 className="eyebrow mb-2">Try a sample entry</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {SCENARIOS.map((s) => (
            <Chip key={s.id} active={activeChip === s.id} onClick={() => loadScenario(s.id)} fid={`chip-${s.id}`}>
              {s.chip}
            </Chip>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Tap a sample, then Save. Or write your own.</p>
      </div>

      <div ref={cardRef} className="scroll-mt-20">
        {last && <ResponseCard entry={last} />}
      </div>

      {ui.underFloor && preview && (
        <EntryMachinery title="live preview of the current draft (not saved)" mapping={preview} rawText={text.trim()} mode={mode} transcriptSource={transcriptSource} preview />
      )}
      {ui.underFloor && last && <EntryMachinery title={`saved entry ${last.id}`} mapping={last.mapping} rawText={last.rawText} mode={last.mode} transcriptSource={last.transcriptSource} />}
      {ui.underFloor && !preview && !last && (
        <div className="dev-panel mt-4">Under the floor: type or pick a sample to watch the agent map it, live.</div>
      )}
    </div>
  );
}
