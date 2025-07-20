import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { useToastStore } from '../../store/toastStore';

const ToastManager: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    const getIcon = (type: 'success' | 'error' | 'info') => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'error':
                return <ExclamationCircleIcon className="w-5 h-5 text-red-400" />;
            case 'info':
                return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                        layout
                        className="mb-2 p-3 bg-gray-800 text-white rounded-lg shadow-lg flex items-center"
                        onHoverEnd={() => removeToast(toast.id)}
                    >
                        {getIcon(toast.type)}
                        <span className="ml-3">{toast.message}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastManager;
