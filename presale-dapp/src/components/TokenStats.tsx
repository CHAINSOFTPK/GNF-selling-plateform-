import React from 'react';
import { motion } from 'framer-motion';
import { RiCoinLine, RiUserLine, RiTimeLine } from 'react-icons/ri';

interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="flex items-center gap-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm"
    >
        <div className="p-3 bg-[#0194FC]/10 rounded-full text-[#0194FC]">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </motion.div>
);

const TokenStats: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatItem
                icon={<RiCoinLine size={24} />}
                label="Total Supply"
                value="5.5M GNF"
                delay={0.1}
            />
            <StatItem
                icon={<RiUserLine size={24} />}
                label="Participants"
                value="10,000+"
                delay={0.2}
            />
            <StatItem
                icon={<RiTimeLine size={24} />}
                label="Sale Ends In"
                value="14 Days"
                delay={0.3}
            />
        </div>
    );
};

export default TokenStats;
