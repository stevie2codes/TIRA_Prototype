import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

/**
 * Mount the Report Designer into a DOM element.
 * Called from TIRA's vanilla JS chat-flow.
 * Returns the React root so the caller can unmount it.
 */
export function mountDesigner(element) {
  const root = createRoot(element);
  root.render(<App />);
  return root;
}
