import React from 'react';
import { PWAPlatform } from '@/hooks/usePWAInstall';

interface InstallInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    platform: PWAPlatform;
}

const InstallInstructionsModal: React.FC<InstallInstructionsModalProps> = ({ isOpen, onClose, platform }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[24px] max-w-[340px] w-full overflow-hidden shadow-2xl animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#8a1c1c] to-[#6b1515] p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg">
                        {platform === 'ios' ? '' : '📱'}
                    </div>
                    <h3 className="text-white font-extrabold text-xl m-0">
                        How to Install
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    {platform === 'ios' ? (
                        <div>
                            <p className="text-[#1f2937] font-semibold mb-4 text-center">
                                iPhone / iPad
                            </p>
                            <ol className="text-[#4b5563] text-sm pl-5 list-decimal space-y-3">
                                <li>
                                    Tap the <strong className="text-[#8a1c1c]">Share</strong> button in Safari
                                </li>
                                <li>
                                    Scroll down and tap <strong className="text-[#8a1c1c]">Add to Home Screen</strong>
                                </li>
                                <li>
                                    Tap <strong className="text-[#8a1c1c]">Add</strong> in the top right corner
                                </li>
                            </ol>
                        </div>
                    ) : (
                        <div>
                            <p className="text-[#1f2937] font-semibold mb-4 text-center">
                                Desktop / Android
                            </p>
                            <ol className="text-[#4b5563] text-sm pl-5 list-decimal space-y-3">
                                <li>
                                    Tap the <strong className="text-[#8a1c1c]">Menu</strong> (three dots) in your browser
                                </li>
                                <li>
                                    Select <strong className="text-[#8a1c1c]">Add to Home Screen</strong> or <strong className="text-[#8a1c1c]">Install App</strong>
                                </li>
                                <li>
                                    Confirm by tapping <strong className="text-[#8a1c1c]">Add</strong>
                                </li>
                            </ol>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-6 w-full py-3.5 bg-[#8a1c1c] text-white font-bold rounded-xl active:scale-95 transition-transform shadow-lg"
                    >
                        Got it!
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
        </div>
    );
};

export default InstallInstructionsModal;
