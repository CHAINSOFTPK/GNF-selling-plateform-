import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TelegramToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    isVisible: boolean;
}

const TelegramToast: React.FC<TelegramToastProps> = ({ message, type, onClose, isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="fixed bottom-[80px] left-0 right-0 mx-auto px-4 z-50 
                             flex justify-center items-center pointer-events-none"
                    style={{ maxWidth: '100%' }}
                >
                    <div 
                        className={`
                            px-4 py-3 rounded-lg shadow-lg
                            ${type === 'success' ? 'bg-[#31B545] border border-[#31B545]/20' : ''}
                            ${type === 'error' ? 'bg-[#E64646] border border-[#E64646]/20' : ''}
                            ${type === 'info' ? 'bg-[#0194FC] border border-[#0194FC]/20' : ''}
                            max-w-[90%] w-auto inline-block
                        `}
                    >
                        <p className="text-white text-center text-sm font-medium break-words">
                            {message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TelegramToast;
