import React from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "primary",
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md animate-entrance"
                onClick={onClose}
            />
            <div className="relative luxury-card p-10 w-full max-w-sm bg-luxury-glow overflow-hidden animate-entrance">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

                <h3 className="font-luxury text-2xl font-black text-white mb-3 italic tracking-tight">{title}</h3>
                <p className="text-white/40 text-sm font-medium mb-10 leading-relaxed uppercase tracking-widest">{message}</p>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-white/5"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-4 font-black rounded-2xl text-black transition-all uppercase text-[10px] tracking-widest shadow-xl ${variant === "danger"
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                : "bg-gold-gradient hover:opacity-90 shadow-primary/20"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
