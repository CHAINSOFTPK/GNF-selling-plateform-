import React from 'react';
import { FaHeart } from 'react-icons/fa';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center text-center">
                  
                    <p className="text-sm text-gray-500">
                        © {currentYear} GlobalNetwork. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
