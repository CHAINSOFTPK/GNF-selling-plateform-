import React from 'react';
import { FaHeart, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import AddNetwork from './AddNetwork';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const navLinks = [
        { title: 'About', path: 'https://www.gnfstore.com/#about' },
        { title: 'How to Buy', path: 'https://www.gnfstore.com/#howtobuy' },
        { title: 'FAQ', path: 'https://www.gnfstore.com/#faq' },
    ];

    const handleNavigation = (path: string) => {
        window.location.href = path;
    };

    return (
        <footer className="relative z-50 bg-transparent border-t border-gray-200 py-6 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-white">
                        © {currentYear} GlobalNetwork. All rights reserved.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center justify-center space-x-4">
                    {navLinks.map((link) => (
                        <button
                            key={link.path}
                            onClick={() => handleNavigation(link.path)}
                            className="text-sm text-white hover:text-gray-300"
                        >
                            {link.title}
                        </button>
                    ))}
                </div>
                <div className="mt-4 md:mt-0 flex items-center justify-center space-x-4">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                        <FaFacebook size={20} />
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                        <FaTwitter size={20} />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                        <FaInstagram size={20} />
                    </a>
                </div>
                <div className="mt-4 md:mt-0 flex items-center justify-center">
                    <AddNetwork buttonText="Add Global Network" />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
