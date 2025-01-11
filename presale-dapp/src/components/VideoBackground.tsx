import React from 'react';

const VideoBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-black/50 z-10" /> {/* Overlay */}
            <iframe
                className="w-full h-full scale-150"
                src="https://www.youtube.com/embed/cR1FyHv_rJE?autoplay=1&mute=1&loop=1&playlist=cR1FyHv_rJE&controls=0&showinfo=0&rel=0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ 
                    pointerEvents: 'none',
                    border: 'none'
                }}
            />
        </div>
    );
};

export default VideoBackground;
