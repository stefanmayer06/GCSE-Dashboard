import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import RouteAnalytics from '../../shared/RouteAnalytics.jsx';
import './styles.css';
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
