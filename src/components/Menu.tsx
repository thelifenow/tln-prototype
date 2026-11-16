import { useUi } from '../state/ui';
import { useDemo } from '../state/demo';
import { Sheet } from './ui';
import { IconChat, IconGrid, IconPlus, IconRefresh, IconDownload } from './Icons';
import type { ReactNode } from 'react';

function Row({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex min-h-[56px] w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-card">
        <span className="text-accent">{icon}</span>
        <span className="flex-1">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
        </span>
      </button>
    </li>
  );
}

export function Menu() {
  const ui = useUi();
  const demo = useDemo();
  const close = () => ui.setOverlay(null);
  return (
    <Sheet open={ui.overlay === 'menu'} onClose={close} title="Menu">
      <ul className="space-y-1">
        <Row icon={<IconGrid />} label="Blueprint" hint="The whiteboard of the system, and its requirements" onClick={() => { close(); ui.go('blueprint'); }} />
        <Row icon={<IconChat />} label={ui.feedbackMode ? 'Turn off Feedback mode' : 'Turn on Feedback mode'} hint="Tap anything to pin a comment" onClick={() => { ui.setFeedbackMode(!ui.feedbackMode); close(); }} />
        <Row icon={<IconChat />} label="Feedback panel" hint="All comments and feature requests" onClick={() => ui.setOverlay('feedback-panel')} />
        <Row icon={<IconPlus />} label="Suggest a feature" onClick={() => ui.setOverlay('feature-form')} />
        <Row icon={<IconDownload />} label="Export · Import · Clear" hint="JSON and Markdown; move work between devices" onClick={() => ui.setOverlay('data')} />
        <Row
          icon={<IconRefresh />}
          label="Reset demo"
          hint="Resets the sample journal and planning. Blueprint and Feedback are kept."
          onClick={() => {
            if (window.confirm('Reset the demo journal and planning data? Blueprint and Feedback are kept.')) {
              demo.reset();
              close();
              ui.go('slate');
              ui.say('Demo reset');
            }
          }}
        />
      </ul>
      <p className="mt-6 text-xs text-muted">Prototype. The mapping is simulated: no AI, no server. Data stays in this browser.</p>
    </Sheet>
  );
}
