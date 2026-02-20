import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import InstallInstructionsModal from './InstallInstructionsModal';

interface PWAInstallButtonProps {
    className?: string;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className }) => {
    const { isInstalled, platform, promptInstall } = usePWAInstall('main');
    const [showInstructions, setShowInstructions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleInstall = async () => {
        if (isInstalled) return;

        setIsProcessing(true);
        const result = await promptInstall();
        setIsProcessing(false);

        if (result === 'manual') {
            setShowInstructions(true);
        }

        if (result === 'accepted') {
            console.log('Customer PWA install accepted');
        }
    };

    if (isInstalled) {
        return (
            <button
                disabled
                className={`${className} opacity-50 cursor-not-allowed`}
                style={{ pointerEvents: 'none' }}
            >
                ✅ Already Installed
            </button>
        );
    }

    return (
        <>
            <button
                onClick={handleInstall}
                className={`${className} ${isProcessing ? 'animate-pulse' : ''}`}
                disabled={isProcessing}
            >
                {isProcessing ? 'Processing...' : '📲 Install the App'}
            </button>

            <InstallInstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                platform={platform}
            />
        </>
    );
};

export default PWAInstallButton;
