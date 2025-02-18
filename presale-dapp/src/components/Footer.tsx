import React from 'react';
import { FaTelegram, FaTwitter, FaDiscord, FaGlobe } from 'react-icons/fa';
import AddNetwork from './AddNetwork';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: <FaTwitter size={18} />, href: 'https://twitter.com/gnfstore', label: 'Twitter' },
        { icon: <FaTelegram size={18} />, href: 'https://t.me/gnfstore', label: 'Telegram' },
        { icon: <FaDiscord size={18} />, href: 'https://discord.gg/gnfstore', label: 'Discord' },
        { icon: <FaGlobe size={18} />, href: 'https://www.gnfstore.com', label: 'Website' },
    ];

    const quickLinks = [
        { title: 'About', path: 'https://www.gnfstore.com/#about' },
        { title: 'How to Buy', path: 'https://www.gnfstore.com/#howtobuy' },
        { title: 'FAQ', path: 'https://www.gnfstore.com/#faq' },
    ];

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50">
            <div className="bg-[#0f172a]/90 backdrop-blur-sm border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-2"> {/* Reduced padding */}
                    <div className="flex items-center justify-between gap-3"> {/* Reduced gap */}
                        {/* Logo and Copyright - More compact */}
                        <div className="flex items-center space-x-2">
                            <img src="/logo.png" alt="GNF Logo" className="h-6 w-auto" /> {/* Reduced size */}
                            <span className="text-white/60 text-xs">
                                © {currentYear} GlobalNetwork
                            </span>
                        </div>

                        {/* Quick Links - More compact */}
                        <div className="flex items-center space-x-4"> {/* Reduced spacing */}
                            {quickLinks.map((link) => (
                                <a
                                    key={link.path}
                                    href={link.path}
                                    className="text-white/70 hover:text-white text-xs font-medium"
                                >
                                    {link.title}
                                </a>
                            ))}
                        </div>

                        {/* Social Links - More compact */}
                        <div className="flex items-center space-x-2"> {/* Reduced spacing */}
                            {socialLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/70 hover:text-white p-1.5 
                                             hover:bg-white/5 rounded-lg"
                                    aria-label={link.label}
                                >
                                    {link.icon}
                                </a>
                            ))}
                        </div>

                        {/* Updated AddNetwork Button */}
                        <div className="hidden sm:block"> {/* Hide on mobile */}
                            <AddNetwork buttonText="GlobalNetwork" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
