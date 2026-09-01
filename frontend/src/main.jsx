import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import BackendStatus from './components/common/BackendStatus.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BackendStatus>
      <App />
    </BackendStatus>
  </StrictMode>
);
