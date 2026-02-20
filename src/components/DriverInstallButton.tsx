import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import InstallInstructionsModal from './InstallInstructionsModal';

interface DriverInstallButtonProps {
    className?: string;
}

const DriverInstallButton: React.FC<DriverInstallButtonProps> = ({ className }) => {
    const { platform } = usePWAInstall('driver');
    const [showInstructions, setShowInstructions] = useState(false);

    const handleDriverInstall = () => {
        const driverUrl = '/driver.html';

        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true;

        if (isStandalone) {
            window.location.href = driverUrl;
            return;
        }

        if (window.location.pathname.includes('driver')) {
            setShowInstructions(true);
        } else {
            window.location.href = driverUrl;
        }
    };

    return (
        <>
            <button
                onClick={handleDriverInstall}
                className={className}
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
