import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import RouteAnalytics from '../../shared/RouteAnalytics.jsx';
// V3 Trailhead: study-desk.css is the structural base; v3.css is the visual
// system and wins every tie (loaded last). theme.css keeps subject accents.
import '../../shared/study-desk.css';
import './theme.css';
import './visuals.css';
import '../../shared/v3.css';
import '../../shared/v4-dashboard.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={window.location.pathname.startsWith('/maths-higher') ? '/maths-higher' : '/maths'}>
      <RouteAnalytics basePath={window.location.pathname.startsWith('/maths-higher') ? '/maths-higher' : '/maths'} />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
