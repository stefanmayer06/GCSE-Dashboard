import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import '../../shared/study-desk.css';
import './theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/english">
      <App />
    </BrowserRouter>
    <Analytics />
  </React.StrictMode>
);
