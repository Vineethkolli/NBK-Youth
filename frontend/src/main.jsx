import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')  // Ensure this path matches your service worker path
      .then(registration => {
        console.log('Service Worker registered with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed: ', error);
      });
  });
}
