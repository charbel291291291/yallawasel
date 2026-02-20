import { useState, useEffect, useCallback } from 'react';

/**
 * Production-grade PWA Install Hook
 * Handles native 'beforeinstallprompt' event, platform detection, 
 * and persistent installation state.
 */

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export type PWAPlatform = 'ios' | 'android' | 'chrome' | 'unknown';

export interface UsePWAInstallReturn {
    canInstall: boolean;
    isInstalled: boolean;
    platform: PWAPlatform;
    deferredPrompt: BeforeInstallPromptEvent | null;
    installApp: () => Promise<'accepted' | 'dismissed' | 'manual'>;
}

export const usePWAInstall = (): UsePWAInstallReturn => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<PWAPlatform>('unknown');

    useEffect(() => {
        // 1. Detect Platform
        const ua = window.navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        const isAndroid = /Android/i.test(ua);
        const isChrome = /Chrome/i.test(ua) && !/Edge|OPR|Brave/i.test(ua);

        if (isIOS) setPlatform('ios');
        else if (isAndroid) setPlatform('android');
        else if (isChrome) setPlatform('chrome');

        // 2. Detect Standalone State
        const checkStandalone = () => {
            const standalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsInstalled(standalone);
        };

        checkStandalone();

        // 3. Listen for Native Prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 4. Listen for Successful Installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    /**
     * Triggers the native installation prompt or signals manual fallback
     */
    const installApp = useCallback(async () => {
        if (platform === 'ios') {
            return 'manual';
        }

        if (!deferredPrompt) {
            return 'manual';
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }

            return outcome;
        } catch (error) {
            console.error('PWA Installation failed', error);
            return 'dismissed';
        }
    }, [deferredPrompt, platform]);

    return {
        canInstall: !!deferredPrompt || platform === 'ios',
        isInstalled,
        platform,
        deferredPrompt,
        installApp
    };
};
