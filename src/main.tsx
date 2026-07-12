import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Daftarkan service worker supaya aplikasi bisa di-install (Add to Home
// Screen / Install App) dan app-shell-nya tetap terbuka walau koneksi
// internet putus. Didaftarkan setelah "load" supaya tidak menunda
// render pertama aplikasi.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Gagal mendaftarkan service worker (PWA offline tidak aktif):", err);
    });
  });
}
