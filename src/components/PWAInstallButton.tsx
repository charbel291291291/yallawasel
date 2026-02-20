import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import InstallInstructionsModal from './InstallInstructionsModal';

interface PWAInstallButtonProps {
    className?: string;
}

/**
 * Enterprise-grade PWA Install Button
 * Triggers native browser install or fallback instructions.
 */
const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className }) => {
    const { isInstalled, installApp, platform } = usePWAInstall();
    const [showInstructions, setShowInstructions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleInstallClick = async () => {
        if (isInstalled) return;

        setIsProcessing(true);
        const result = await installApp();
        setIsProcessing(false);

        if (result === 'manual') {
            setShowInstructions(true);
        }
    };

    // Do not render if the app is already running in standalone mode
    if (isInstalled) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                className={`${className} ${isProcessing ? 'animate-pulse opacity-80' : ''}`}
                disabled={isProcessing}
                aria-label="Install Yalla Wasel App"
            >
                {isProcessing ? 'Preparing...' : '📲 Install the App'}
            </button>

            {/* Manual Installation Instructions for iOS or restricted browsers */}
            <InstallInstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                platform={platform}
            />
        </>
    );
};

export default PWAInstallButton;
