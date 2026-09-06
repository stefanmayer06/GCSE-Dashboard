import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import RouteAnalytics from '../../shared/RouteAnalytics.jsx';
// NOTE: legacy neon `styles.css` was removed in v3 — `study-desk.css` is the
// single source of truth (base shell + Ruled Notebook tokens live there).
import '../../shared/study-desk.css';
import './theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/english">
      <RouteAnalytics basePath="/english" />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
