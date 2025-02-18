import React from 'react';
import { FaBook, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface TelegramFooterProps {
    onMenuClick: (action: 'buy' | 'dashboard' | 'guide') => void;
    currentPage?: 'buy' | 'dashboard' | 'guide';
    navigationText: {
        guide: string;
        dashboard: string;
        buy: string;
    };
}

const TelegramFooter: React.FC<TelegramFooterProps> = ({ 
    onMenuClick, 
    currentPage = 'guide',
    navigationText 
}) => {
    const navigate = useNavigate();

    const handleMenuClick = (action: 'buy' | 'dashboard' | 'guide') => {
        switch(action) {
            case 'buy':
                navigate('/bot');
                break;
            case 'dashboard':
                navigate('/telegramdashboard'); // Updated path
                break;
            case 'guide':
                navigate('/telegramguide'); // Updated to use the new route
                break;
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1c] border-t border-gray-800 px-4 py-3">
            <div className="max-w-md mx-auto flex justify-between items-center relative">
                {/* Guide Button */}
                <button
                    onClick={() => onMenuClick('guide')}
                    className="flex flex-col items-center space-y-1"
                >
                    <FaBook 
                        className={currentPage === 'guide' ? 'text-[#0194FC]' : 'text-gray-400'}
                    />
                    <span className={currentPage === 'guide' ? 'text-[#0194FC]' : 'text-gray-400'}>
                        {navigationText.guide}
                    </span>
                </button>

                {/* Center Circle Buy Button */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-8">
                    <button
                        onClick={() => onMenuClick('buy')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center
                                 shadow-lg border-4 border-[#1c1c1c] transform transition-transform
                                 hover:scale-105 active:scale-95 ${currentPage === 'buy' ? 'bg-[#0194FC]' : 'bg-gray-600'}`}
                    >
                        <span className="text-white text-lg">{navigationText.buy}</span>
                    </button>
                </div>

                {/* Dashboard Button */}
                <button
                    onClick={() => onMenuClick('dashboard')}
                    className="flex flex-col items-center space-y-1"
                >
                    <FaChartLine 
                        className={currentPage === 'dashboard' ? 'text-[#0194FC]' : 'text-gray-400'}
                    />
                    <span className={currentPage === 'dashboard' ? 'text-[#0194FC]' : 'text-gray-400'}>
                        {navigationText.dashboard}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default TelegramFooter;
