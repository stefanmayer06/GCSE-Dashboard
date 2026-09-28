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
import './visuals.css';
import '../../shared/circuit/circuit.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={window.location.pathname.startsWith('/maths-higher') ? '/maths-higher' : '/maths'}>
      <RouteAnalytics basePath={window.location.pathname.startsWith('/maths-higher') ? '/maths-higher' : '/maths'} />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
