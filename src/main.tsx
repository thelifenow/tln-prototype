import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import './index.css';
import App from './App';
import { DemoProvider } from './state/demo';
import { WorkspaceProvider } from './state/workspace';
import { UiProvider } from './state/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiProvider>
      <DemoProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </DemoProvider>
    </UiProvider>
  </StrictMode>,
);
