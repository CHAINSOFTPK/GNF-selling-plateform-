import React from 'react';

export const HexagonPattern = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none">
        <path d="M25,0 L75,0 L100,43.3 L75,86.6 L25,86.6 L0,43.3 Z" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            fill="none"
        />
    </svg>
);

export const WavePattern = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 100 20">
        <path d="M0,10 Q25,20 50,10 T100,10" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            fill="none" 
            strokeDasharray="2,2"
        />
    </svg>
);

export const DiagonalAccent = ({ className = '' }) => (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
                <linearGradient id="diagonalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0194FC" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#300855" stopOpacity="0.1" />
                </linearGradient>
            </defs>
            <path
                d="M0,0 L100,0 L100,85 L0,100 Z"
                fill="url(#diagonalGrad)"
            />
        </svg>
    </div>
);

export const GlowEffect = ({ className = '' }) => (
    <div className={`absolute inset-0 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0194FC]/10 to-[#300855]/10 blur-xl" />
    </div>
);
