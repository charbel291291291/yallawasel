import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export type PWAPlatform = 'ios' | 'android' | 'desktop' | 'unknown';

export interface UsePWAInstallReturn {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
    platform: PWAPlatform;
    promptInstall: () => Promise<'accepted' | 'dismissed' | 'manual'>;
}

export const usePWAInstall = (manifestType: 'main' | 'driver' = 'main'): UsePWAInstallReturn => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [platform, setPlatform] = useState<PWAPlatform>('unknown');

    useEffect(() => {
        // Detect Platform
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/i.test(ua)) {
            setPlatform('ios');
        } else if (/Android/i.test(ua)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }

        // Detect Standalone Mode
        const checkStandalone = () => {
            const standalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (navigator as any).standalone === true;
            setIsStandalone(standalone);
        };

        checkStandalone();

        // Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for appinstalled
        const handleAppInstalled = () => {
            setIsStandalone(true);
            setDeferredPrompt(null);
            // Optional: Log analytics
            console.log('PWA was installed');
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (platform === 'ios') {
            return 'manual';
        }

        if (!deferredPrompt) {
            return 'manual';
        }

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);

        return outcome;
    }, [deferredPrompt, platform]);

    return {
        canInstall: !!deferredPrompt || platform === 'ios',
        isInstalled: isStandalone,
        isStandalone,
        platform,
        promptInstall
    };
};
