import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@tylertech/forge/dist/forge.css';
import { defineComponents } from '@tylertech/forge';
import './App.css';

defineComponents();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
