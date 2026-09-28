import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import RouteAnalytics from '../../shared/RouteAnalytics.jsx';
import '../../shared/circuit/fonts.js';
// Circuit (v5): study-desk.css is the structural base, theme.css holds
// subject-only component tweaks, circuit.css is the visual system and wins
// every tie (loaded last).
import '../../shared/study-desk.css';
import './theme.css';
import '../../shared/circuit/circuit.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/english">
      <RouteAnalytics basePath="/english" />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
