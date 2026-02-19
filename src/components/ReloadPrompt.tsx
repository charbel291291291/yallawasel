import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered() {
            // SW registered successfully
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <div className="Container">
            {(offlineReady || needRefresh) && (
                <div className="fixed bottom-4 right-4 z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-slideUp max-w-[300px]">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <i className={`fa-solid ${offlineReady ? 'fa-check' : 'fa-bolt'}`}></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">
                                {offlineReady ? "Ready for offline use" : "New update available!"}
                            </h3>
                            <p className="text-xs text-gray-500 leading-tight mt-1">
                                {offlineReady
                                    ? "App cached successfully."
                                    : "A new version of the driver app is available. Update now for new features."}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-1">
                        {needRefresh && (
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                                Update Now
                            </button>
                        )}
                        <button
                            onClick={close}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReloadPrompt;
