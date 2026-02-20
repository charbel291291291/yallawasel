import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import InstallInstructionsModal from './InstallInstructionsModal';

interface DriverInstallButtonProps {
    className?: string;
}

/**
 * Driver-specific PWA Install Logic
 * Redirects to the dedicated driver portal to trigger a separate manifest/install.
 */
const DriverInstallButton: React.FC<DriverInstallButtonProps> = ({ className }) => {
    const { platform } = usePWAInstall();
    const [showInstructions, setShowInstructions] = useState(false);

    const handleDriverInstall = () => {
        // Production Requirement: Use separate subdomain for driver PWA if available,
        // otherwise fallback to driver-specific path.
        const DRIVER_PORTAL_URL = 'https://driver.yallawasel.com';
        const LOCAL_DRIVER_PATH = '/driver.html';

        // In production environment (Vercel), we prefer the subdomain
        const isProduction = window.location.hostname.includes('yallawasel.com');
        const targetUrl = isProduction ? DRIVER_PORTAL_URL : LOCAL_DRIVER_PATH;

        // Check if we are already in standalone (installed)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            // If already in standalone mode, just navigate to the driver dashboard
            window.location.href = targetUrl;
            return;
        }

        // Logic: Redirect to the portal where the browser will see a different manifest
        // and can trigger a separate 'Driver' app installation.
        window.location.href = targetUrl;
    };

    return (
        <>
            <button
                onClick={handleDriverInstall}
                className={className}
                aria-label="Install Yalla Wasel Driver App"
            >
                🛵 Install Driver App
            </button>

            <InstallInstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                platform={platform}
            />
        </>
    );
};

export default DriverInstallButton;
