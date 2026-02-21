/**
 * PWA ARCHITECTURAL UTILITIES
 * Hardened environment detection for standalone mobile deployment.
 */

export const pwaUtils = {
    /**
     * DETECT STANDALONE MODE
     * Returns true if application is running in 'standalone' (native-like) display mode.
     */
    isStandalone: (): boolean => {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://')
        );
    },

    /**
     * DETECT MOBILE ENVIRONMENT
     * Returns true if the user agent matches mobile device criteria.
     */
    isMobile: (): boolean => {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    },

    /**
     * DETECT DESKTOP BROWSER
     * Inverse of isMobile, used for hard-locking access on non-mobile platforms.
     */
    isDesktop: (): boolean => {
        return !pwaUtils.isMobile();
    }
};
