import { Header, TabBar } from './components/Chrome';
import { useUi } from './state/ui';
import { Slate } from './screens/Slate';
import { Today } from './screens/Today';
import { Season } from './screens/Season';
import { Journal } from './screens/Journal';
import { Menu } from './components/Menu';
import { DataSheet } from './components/DataSheet';
import { Blueprint } from './blueprint/Blueprint';

export default function App() {
  const ui = useUi();
  return (
    <div className="min-h-screen pb-28">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className={`mx-auto px-4 py-5 ${ui.screen === 'blueprint' ? 'max-w-5xl' : 'max-w-xl'}`} data-feedback-id={`screen-${ui.screen}`}>
        {ui.screen === 'slate' && <Slate />}
        {ui.screen === 'today' && <Today />}
        {ui.screen === 'season' && <Season />}
        {ui.screen === 'journal' && <Journal />}
        {ui.screen === 'blueprint' && <Blueprint />}
      </main>
      <TabBar />
      <Menu />
      <DataSheet />
      {ui.toast && (
        <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {ui.toast}
        </div>
      )}
    </div>
  );
}
