import React from 'react';
import { FaCoins, FaUserCheck, FaGift } from 'react-icons/fa';

interface ActivityIconProps {
    type: 'purchase' | 'verification' | 'claim';
}

const ActivityIcon: React.FC<ActivityIconProps> = ({ type }) => {
    switch (type) {
        case 'purchase':
            return <FaCoins className="text-[#08B4A6]" />;
        case 'verification':
            return <FaUserCheck className="text-blue-500" />;
        case 'claim':
            return <FaGift className="text-purple-500" />;
        default:
            return null;
    }
};

export default ActivityIcon;
