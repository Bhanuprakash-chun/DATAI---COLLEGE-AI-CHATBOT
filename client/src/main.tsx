import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register PWA service worker if available
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('DatAI ServiceWorker registered with scope: ', registration.scope);
      },
      (err) => {
        console.log('DatAI ServiceWorker registration failed: ', err);
      }
    );
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
