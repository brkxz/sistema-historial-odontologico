import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/layout.css'
import './styles/pages.css'
import './styles/odontogram.css'
import './styles/ai-assistant.css'
import './styles/landing.css'
import App from './App.jsx'

// Ocultar el splash screen (#app-loader) apenas React este listo
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 400);
  }
};

// Safety timeout: si algo falla, ocultar el loader igual a los 4 segundos
setTimeout(hideLoader, 4000);

// Auto-reload cuando el Service Worker instala una nueva version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Ocultar loader apenas React termine de pintar el primer frame
requestAnimationFrame(() => {
  requestAnimationFrame(hideLoader);
});

