import React from 'react';

const HowToBuy: React.FC = () => {
    const bgStyle = {
        background: 'linear-gradient(135deg, #2F0D5B 0%, #0194FC 100%)'
    };

    return (
        <div className="min-h-screen text-white py-4" style={bgStyle}>
            <div className="container mx-auto px-2 space-y-3">
                <div className="flex flex-col space-y-3">
                    <section className="flex flex-col items-center bg-black/20 p-2 rounded-lg shadow-lg hover:bg-black/30 transition-all border border-white/50 shadow-white/20">
                        <h2 className="text-base md:text-lg font-bold mb-1 text-cyan-300">How to Buy with BNB</h2>
                        <div className="w-full max-w-sm aspect-video">
                            <iframe 
                                className="w-full h-full rounded-md shadow-lg"
                                src="https://www.youtube.com/embed/your-bnb-video-id"
                                title="How to Buy with BNB"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </section>

                    <section className="flex flex-col items-center bg-black/20 p-2 rounded-lg shadow-lg hover:bg-black/30 transition-all border border-white/50 shadow-white/20">
                        <h2 className="text-base md:text-lg font-bold mb-1 text-cyan-300">How to Buy with AVAX</h2>
                        <div className="w-full max-w-sm aspect-video">
                            <iframe 
                                className="w-full h-full rounded-md shadow-lg"
                                src="https://www.youtube.com/embed/your-avax-video-id"
                                title="How to Buy with AVAX"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </section>

                    <section className="flex flex-col items-center bg-black/20 p-2 rounded-lg shadow-lg hover:bg-black/30 transition-all border border-white/50 shadow-white/20">
                        <h2 className="text-base md:text-lg font-bold mb-1 text-cyan-300">How to Buy with MATIC</h2>
                        <div className="w-full max-w-sm aspect-video">
                            <iframe 
                                className="w-full h-full rounded-md shadow-lg"
                                src="https://www.youtube.com/embed/your-matic-video-id"
                                title="How to Buy with MATIC"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HowToBuy;
