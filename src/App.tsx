import { Header, TabBar } from './components/Chrome';
import { useUi } from './state/ui';

export default function App() {
  const ui = useUi();
  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6">{ui.screen}</main>
      <TabBar />
    </div>
  );
}
