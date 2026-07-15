import { useEffect, useRef } from 'react';

export default function Toast({ message, type = 'error', onClose }) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const timer = setTimeout(() => onCloseRef.current(), 3500);
        return () => clearTimeout(timer);
    }, []);

    const styles = {
        error: 'bg-red-600',
        success: 'bg-emerald-600',
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm shadow-lg max-w-sm ${styles[type]}`}
            role="alert"
            aria-live="polite"
        >
            <span className="flex-1">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 text-white/80 hover:text-white font-bold leading-none shrink-0"
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}
