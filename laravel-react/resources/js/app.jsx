import React from 'react';
import { createRoot } from 'react-dom/client';
import RootApp from './RootApp';

const isLocalDevelopment =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const CACHE_RESET_VERSION = '2026-05-04-mobile-auth-fix';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const clearServiceWorkerState = () =>
            navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
                .then(() => ('caches' in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : undefined));

        if (isLocalDevelopment) {
            clearServiceWorkerState().catch((error) => {
                console.error('Service worker cleanup failed:', error);
            });

            return;
        }

        const previousResetVersion = window.localStorage?.getItem('inalog-silog-cache-reset-version');
        const needsCacheReset = previousResetVersion !== CACHE_RESET_VERSION;
        const cleanupTask = needsCacheReset ? clearServiceWorkerState() : Promise.resolve();

        cleanupTask
            .then(() => {
                if (needsCacheReset) {
                    window.localStorage?.setItem('inalog-silog-cache-reset-version', CACHE_RESET_VERSION);
                }

                return navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
            })
            .then((registration) => registration.update())
            .catch((error) => {
                console.error('Service worker registration failed:', error);
            });
    });
}

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <RootApp />
    </React.StrictMode>,
);
