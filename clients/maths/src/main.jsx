import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import '../../shared/study-desk.css';
import './theme.css';
import './visuals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={window.location.pathname.startsWith('/maths-higher') ? '/maths-higher' : '/maths'}>
      <App />
    </BrowserRouter>
    <Analytics />
  </React.StrictMode>
);
