import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { AppErrorBoundary } from '../components/errors/AppErrorBoundary';

export const mountPicklinkApp = (app: ReactElement) => {
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root element');

  createRoot(root).render(
    <StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            {app}
          </AuthProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </StrictMode>,
  );
};
