import React from 'react';
import { FaHeart } from 'react-icons/fa';
import AddNetwork from './AddNetwork';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-50 bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-gray-500">
                        © {currentYear} GlobalNetwork. All rights reserved.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center justify-center">
                    <AddNetwork buttonText="Add Global Network" />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
