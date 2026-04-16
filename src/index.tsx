import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './server'; // Register SW eagerly at startup

const root = ReactDOM.createRoot(
  document.getElementById('root') as Element
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
