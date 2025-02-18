import React from 'react';
import { motion } from 'framer-motion';

const DashboardLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 w-full h-full bg-[#0f172a] overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                {/* Enhanced Gradient Animation */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-[#0f172a]"
                    animate={{
                        background: [
                            'radial-gradient(circle at 30% 30%, rgba(1,148,252,0.1) 0%, rgba(48,8,85,0.05) 50%, rgba(15,23,42,1) 100%)',
                            'radial-gradient(circle at 70% 70%, rgba(1,148,252,0.1) 0%, rgba(48,8,85,0.05) 50%, rgba(15,23,42,1) 100%)',
                            'radial-gradient(circle at 30% 30%, rgba(1,148,252,0.1) 0%, rgba(48,8,85,0.05) 50%, rgba(15,23,42,1) 100%)',
                        ],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                {/* Enhanced Particle Animation */}
                <div className="absolute inset-0">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-[#0194FC]"
                            style={{
                                borderRadius: '50%',
                                boxShadow: '0 0 20px 2px rgba(1,148,252,0.3)'
                            }}
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                                scale: Math.random() * 2
                            }}
                            animate={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                                scale: [1, 2, 1],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 5 + Math.random() * 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    ))}
                </div>

                {/* Grid Pattern */}
                <div 
                    className="absolute inset-0" 
                    style={{ 
                        backgroundImage: 'url("/grid.svg")',
                        backgroundSize: '40px 40px',
                        opacity: 0.03
                    }} 
                />
            </div>

            {/* Enhanced Loader */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                    {/* Outer Rotating Ring */}
                    <motion.div
                        className="absolute -inset-16 rounded-full border-2 border-[#0194FC]/20"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 4,
                            ease: "linear",
                            repeat: Infinity
                        }}
                    />

                    {/* Multiple Middle Rings */}
                    {[12, 8, 4].map((size, index) => (
                        <motion.div
                            key={index}
                            className={`absolute -inset-${size} rounded-full border border-[#0194FC]/${30 - (index * 5)}`}
                            animate={{ rotate: index % 2 === 0 ? 360 : -360 }}
                            transition={{
                                duration: 3 + index,
                                ease: "linear",
                                repeat: Infinity
                            }}
                        />
                    ))}

                    {/* Center Logo with Enhanced Animation */}
                    <div className="relative z-10 bg-[#0f172a] p-8 rounded-full border border-[#0194FC]/10">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotateY: [0, 360],
                                opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <img 
                                src="/logo.png" 
                                alt="GNF Logo" 
                                className="w-20 h-20 object-contain"
                            />
                        </motion.div>
                    </div>

                    {/* Pulsing Glow Effect */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-[#0194FC]"
                        animate={{
                            boxShadow: [
                                '0 0 20px 10px rgba(1,148,252,0.1)',
                                '0 0 40px 20px rgba(1,148,252,0.2)',
                                '0 0 20px 10px rgba(1,148,252,0.1)'
                            ],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardLoader;
