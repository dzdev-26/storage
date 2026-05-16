import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for structuredClone for older Android WebViews
if (typeof structuredClone !== 'function') {
  window.structuredClone = function <T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
