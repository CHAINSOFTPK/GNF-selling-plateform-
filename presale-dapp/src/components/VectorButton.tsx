import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface VectorButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    isActive?: boolean;
    showGlow?: boolean;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

const VectorButton: React.FC<VectorButtonProps> = ({
    children,
    variant = 'primary',
    isActive = false,
    showGlow = false,
    className = '',
    onClick,
    disabled = false,
    ...props
}) => {
    const baseClasses = "relative overflow-hidden rounded-xl font-medium transition-all duration-300";
    const glowClasses = showGlow ? "before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#0194FC]/20 before:to-[#300855]/20 before:blur-xl" : "";
    
    const variants = {
        primary: "bg-gradient-to-r from-[#0194FC] to-[#0182e0] text-white hover:shadow-lg hover:shadow-blue-500/20",
        secondary: "bg-[#1e293b] border border-white/10 text-white hover:bg-[#1e293b]/80",
        outline: "border border-white/20 text-white hover:border-white/40"
    };

    return (
        <motion.button
            whileHover={disabled ? undefined : { scale: 1.02 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            onClick={onClick}
            disabled={disabled}
            className={`
                ${baseClasses}
                ${variants[variant]}
                ${glowClasses}
                ${isActive ? 'ring-2 ring-[#0194FC]' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
        >
            <div className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </div>
            <div className="absolute inset-0 opacity-50">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d="M0,0 L100,0 L95,100 L5,100 Z"
                        fill="currentColor"
                        fillOpacity="0.1"
                    />
                </svg>
            </div>
        </motion.button>
    );
};

export default VectorButton;
