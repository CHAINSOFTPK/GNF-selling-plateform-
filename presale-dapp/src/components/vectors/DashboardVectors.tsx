import React from 'react';

export const CircuitPattern = ({ className = '' }) => (
    <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M10,50 Q30,30 50,50 T90,50" stroke="currentColor" strokeWidth="0.5" fill="none"/>
            <circle cx="10" cy="50" r="2" fill="currentColor"/>
            <circle cx="50" cy="50" r="2" fill="currentColor"/>
            <circle cx="90" cy="50" r="2" fill="currentColor"/>
        </svg>
    </div>
);

export const HexGrid = ({ className = '' }) => (
    <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <pattern id="hexGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M5,0 L10,2.5 L10,7.5 L5,10 L0,7.5 L0,2.5 Z" stroke="currentColor" fill="none"/>
            </pattern>
            <rect width="100" height="100" fill="url(#hexGrid)"/>
        </svg>
    </div>
);

export const GlowEffect = ({ className = '' }) => (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0194FC] to-[#300855] opacity-30 blur-xl"/>
    </div>
);
