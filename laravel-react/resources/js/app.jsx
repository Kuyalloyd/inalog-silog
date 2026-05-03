import React from 'react';
import { createRoot } from 'react-dom/client';
import RootApp from './RootApp';

const isLocalDevelopment =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        if (isLocalDevelopment) {
            navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
                .then(() => ('caches' in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : undefined))
                .catch((error) => {
                    console.error('Service worker cleanup failed:', error);
                });

            return;
        }

        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Service worker registration failed:', error);
        });
    });
}

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <RootApp />
    </React.StrictMode>,
);
