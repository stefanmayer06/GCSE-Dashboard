import { useEffect, useState } from 'react';

// Installable-app plumbing shared by both clients.
// - Keeps the browser's install prompt (Chrome and Android fire it once,
//   early) so Me can offer an "Install" button later.
// - Registers the service worker that lets the installed app open without a
//   connection. It never caches /api: user data always comes from the server.

let deferredPrompt = null;
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener(deferredPrompt);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!window.isSecureContext) return;
  // Dev servers (Vite on 5173/5174) keep their own module graph.
  if (['5173', '5174'].includes(window.location.port)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(deferredPrompt);
  const [installed, setInstalled] = useState(isStandalone);
  useEffect(() => {
    const listener = (next) => {
      setPrompt(next);
      if (!next) setInstalled(isStandalone());
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
  async function install() {
    if (!prompt) return false;
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    deferredPrompt = null;
    setPrompt(null);
    if (choice?.outcome === 'accepted') setInstalled(true);
    return choice?.outcome === 'accepted';
  }
  return { canInstall: Boolean(prompt), install, installed, ios };
}
