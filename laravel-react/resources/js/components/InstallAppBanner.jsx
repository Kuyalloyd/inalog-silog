import { useEffect, useState } from 'react';

function isMobileDevice() {
    if (typeof window === 'undefined') {
        return false;
    }

    const userAgent = window.navigator.userAgent || '';
    const isTouchMac = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;

    return /android|iphone|ipad|ipod|mobile/i.test(userAgent) || isTouchMac;
}

function isStandaloneMode() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function getInstallGuide() {
    if (typeof window === 'undefined') {
        return {
            title: 'Open the site on your phone to install it.',
            text: 'Use a supported mobile browser to install the app.',
        };
    }

    const userAgent = window.navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);

    if (isIos) {
        return {
            title: 'Add Inalog Silog to your iPhone home screen.',
            text: 'Tap Share in Safari, then choose Add to Home Screen.',
        };
    }

    if (isAndroid) {
        return {
            title: 'Install Inalog Silog on your Android phone.',
            text: 'Tap Install app below, or open the browser menu and choose Install app.',
        };
    }

    return {
        title: 'Save Inalog Silog on your phone.',
        text: 'Open the browser menu and choose Install app or Add to Home Screen.',
    };
}

const DISMISS_KEY = 'inalog-silog-install-banner-dismissed';

export default function InstallAppBanner() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isStandaloneMode() || !isMobileDevice()) {
            return undefined;
        }

        if (typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === 'true') {
            return undefined;
        }

        setIsVisible(true);
        
        function handleBeforeInstallPrompt(event) {
            event.preventDefault();
            setInstallPrompt(event);
            setIsVisible(true);
        }

        function handleAppInstalled() {
            setInstallPrompt(null);
            setIsVisible(false);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(DISMISS_KEY, 'true');
            }
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    async function handleInstall() {
        if (!installPrompt) {
            return;
        }

        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
        setIsVisible(false);
    }

    function handleDismiss() {
        setIsVisible(false);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(DISMISS_KEY, 'true');
        }
    }

    if (!isVisible) {
        return null;
    }

    const installGuide = getInstallGuide();

    return (
        <section className="page-section">
            <div className="install-banner">
                <div className="install-banner__copy">
                    <p className="eyebrow">Web and phone ready</p>
                    <h2 className="install-banner__title">{installGuide.title}</h2>
                    <p className="install-banner__text">
                        {installPrompt ? 'Tap Install app to place Inalog Silog on your home screen.' : installGuide.text}
                    </p>
                </div>

                <div className="install-banner__actions">
                    {installPrompt ? (
                        <button className="button-link install-banner__button" type="button" onClick={handleInstall}>
                            Install app
                        </button>
                    ) : null}

                    <button className="button-link--ghost install-banner__button" type="button" onClick={handleDismiss}>
                        Use browser
                    </button>
                </div>
            </div>
        </section>
    );
}
