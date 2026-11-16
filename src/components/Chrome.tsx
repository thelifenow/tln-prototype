import type { ScreenId } from '../types';
import { useUi } from '../state/ui';
import { IconBook, IconChat, IconLayers, IconMenu, IconPen, IconPlus, IconRoad, IconSun, IconBack } from './Icons';

export function Header() {
  const ui = useUi();
  const inBlueprint = ui.screen === 'blueprint';
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur" data-feedback-ui>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-2 sm:px-4">
        {inBlueprint ? (
          <button type="button" className="tap gap-1 px-2 text-sm font-medium" onClick={() => ui.go('slate')} aria-label="Back to the app">
            <IconBack /> <span className="hidden sm:inline">Back to app</span>
          </button>
        ) : null}
        <div className="min-w-0 flex-1 px-2">
          <div className="truncate font-heading text-lg font-semibold tracking-tight">{inBlueprint ? 'Blueprint' : 'The Life NOW'}</div>
        </div>
        <button
          type="button"
          aria-pressed={ui.feedbackMode}
          aria-label="Feedback mode"
          title="Feedback mode"
          onClick={() => ui.setFeedbackMode(!ui.feedbackMode)}
          className={`tap gap-1.5 px-2 text-sm font-medium ${ui.feedbackMode ? 'bg-[#FDF0D5] text-[#7A4A00] ring-1 ring-[#C77C02]' : 'text-ink'}`}
        >
          <IconChat /> <span className="hidden sm:inline">Feedback</span>
        </button>
        <button
          type="button"
          aria-pressed={ui.underFloor}
          aria-label="Under the floor"
          title="Under the floor"
          onClick={() => ui.setUnderFloor(!ui.underFloor)}
          className={`tap gap-1.5 px-2 text-sm font-medium ${ui.underFloor ? 'bg-dev-bg text-dev-amber' : 'text-ink'}`}
        >
          <IconLayers /> <span className="hidden sm:inline">Under the floor</span>
        </button>
        <button type="button" aria-label="Menu" title="Menu" onClick={() => ui.setOverlay('menu')} className="tap">
          <IconMenu />
        </button>
      </div>
      {ui.feedbackMode && (
        <div className="border-t border-[#E9C77A] bg-[#FDF0D5] text-[#5C3800]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-1.5 text-sm">
            <span className="flex-1 min-w-0 truncate">Tap anything to comment.</span>
            <button type="button" className="tap gap-1 px-2 font-semibold" onClick={() => ui.setOverlay('feature-form')}>
              <IconPlus size={18} /> Feature
            </button>
            <button type="button" className="tap px-2 font-semibold" onClick={() => ui.setOverlay('feedback-panel')}>
              Panel
            </button>
            <button type="button" className="tap px-2 font-semibold" onClick={() => ui.setFeedbackMode(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

const TABS: Array<{ id: ScreenId; label: string; Icon: typeof IconPen }> = [
  { id: 'slate', label: 'Slate', Icon: IconPen },
  { id: 'today', label: 'Today', Icon: IconSun },
  { id: 'season', label: 'Season', Icon: IconRoad },
  { id: 'journal', label: 'Journal', Icon: IconBook },
];

export function TabBar() {
  const ui = useUi();
  return (
    <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-paper/95 backdrop-blur pb-safe" data-feedback-ui>
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const active = ui.screen === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => ui.go(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? 'text-accent' : 'text-muted'}`}
              >
                <Icon size={22} />
                <span>{label}</span>
                <span className={`mt-0.5 h-0.5 w-6 rounded ${active ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
