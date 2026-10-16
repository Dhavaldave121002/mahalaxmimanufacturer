import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Automatically reload on new Vercel deployments when chunk hashes change
window.addEventListener('vite:preloadError', () => {
  console.warn('New deployment detected on Vercel, auto-reloading to latest assets...');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
