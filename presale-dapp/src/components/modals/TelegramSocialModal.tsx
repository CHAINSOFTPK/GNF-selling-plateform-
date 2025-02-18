import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTwitter, FaDiscord } from 'react-icons/fa';
import { RiCloseLine } from 'react-icons/ri';
import { submitSocialHandles } from '../../services/tokenService';

interface TelegramSocialModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: string;
    setHasSubmitted: (value: boolean) => void;
    setVerificationStatus: (status: 'none' | 'pending' | 'verified') => void;
    hasSubmitted: boolean;
}

const TelegramSocialModal: React.FC<TelegramSocialModalProps> = ({
    isOpen,
    onClose,
    account,
    setHasSubmitted,
    setVerificationStatus,
    hasSubmitted
}) => {
    const [twitterHandle, setTwitterHandle] = useState('');
    const [discordHandle, setDiscordHandle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!account) return;
        
        if (hasSubmitted) {
            // Use toast from parent component
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await submitSocialHandles(account, twitterHandle, discordHandle);
            if (response.success) {
                setVerificationStatus('pending');
                setHasSubmitted(true);
                onClose();
            }
        } catch (error: any) {
            if (error.response?.data?.message === 'Already submitted') {
                setHasSubmitted(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="w-full max-w-md bg-[#1c1c1c] rounded-t-2xl sm:rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Social Verification</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <RiCloseLine className="text-white" size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Social Links */}
                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href="https://twitter.com/megapayer"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 p-3 bg-[#1DA1F2]/10 rounded-xl hover:bg-[#1DA1F2]/20 transition-colors"
                                >
                                    <FaTwitter className="text-[#1DA1F2]" size={20} />
                                    <span className="text-sm font-medium text-white">Follow Twitter</span>
                                </a>
                                <a
                                    href="https://discord.gg/NVqRsTnQ"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 p-3 bg-[#5865F2]/10 rounded-xl hover:bg-[#5865F2]/20 transition-colors"
                                >
                                    <FaDiscord className="text-[#5865F2]" size={20} />
                                    <span className="text-sm font-medium text-white">Join Discord</span>
                                </a>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-white/60 mb-1 block">Twitter Handle</label>
                                    <input
                                        type="text"
                                        value={twitterHandle}
                                        onChange={(e) => setTwitterHandle(e.target.value)}
                                        placeholder="@username"
                                        className="w-full px-4 py-3 bg-[#2c2c2c] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0194FC]"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/60 mb-1 block">Discord Handle</label>
                                    <input
                                        type="text"
                                        value={discordHandle}
                                        onChange={(e) => setDiscordHandle(e.target.value)}
                                        placeholder="username#0000"
                                        className="w-full px-4 py-3 bg-[#2c2c2c] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0194FC]"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !twitterHandle || !discordHandle}
                                className="w-full py-3 px-4 bg-[#0194FC] hover:bg-[#0182e0] disabled:bg-gray-600 
                                         disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    'Submit for Verification'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TelegramSocialModal;
