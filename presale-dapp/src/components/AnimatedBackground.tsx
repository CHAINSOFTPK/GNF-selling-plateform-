import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white to-[#0194FC]/5" />
            
            {/* Animated circles */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.2, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                }}
                className="absolute top-20 left-20 w-96 h-96 bg-[#0194FC]/10 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    delay: 1,
                }}
                className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.2, 0.15, 0.2],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    delay: 2,
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
            />
        </div>
    );
};

export default AnimatedBackground;
