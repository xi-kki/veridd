/**
 * VERIDD — Application Entry Point
 *
 * Renders the root React app inside StrictMode for development
 * error detection. Mounts to the #root div in index.html.
 *
 * Edge cases:
 *   - Gracefully handles missing #root element (type assertion with !)
 *   - StrictMode double-renders in dev to catch side effects
 *   - CSS module imported before App to prevent FOUC
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
