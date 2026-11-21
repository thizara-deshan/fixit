import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import { PlaceholderPage } from '@/app/placeholder-page';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root is missing from index.html');

createRoot(rootEl).render(
  <StrictMode>
    <PlaceholderPage />
  </StrictMode>,
);
