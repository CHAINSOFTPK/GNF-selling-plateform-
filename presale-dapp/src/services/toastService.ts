import { Dispatch, SetStateAction } from 'react';

interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
}

export const createToastService = (setToastState: Dispatch<SetStateAction<ToastState>>) => {
    const hideToast = () => {
        setToastState(prev => ({ ...prev, isVisible: false }));
    };

    return {
        show: (message: string, type: 'success' | 'error' | 'info', duration: number = 3000) => {
            setToastState({ message, type, isVisible: true });
            const timer = setTimeout(hideToast, duration);
            return () => clearTimeout(timer);
        },
        dismiss: () => hideToast()
    };
};
