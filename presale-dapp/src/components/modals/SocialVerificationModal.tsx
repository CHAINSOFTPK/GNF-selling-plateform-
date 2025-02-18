import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaTwitter, FaDiscord, FaArrowRight } from 'react-icons/fa';
import { AiOutlineFieldTime } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { submitSocialHandles } from '../../services/tokenService';
import { SocialVerificationProps } from '../../types/token';
import { HexagonPattern, WavePattern, DiagonalAccent, GlowEffect } from '../vectors/ModalVectors';
import VectorButton from '../VectorButton';

const VectorAccent: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M0 0L100 0L80 100L20 100L0 0Z"
            fill="currentColor"
            fillOpacity="0.1"
        />
    </svg>
);

const CircuitPattern = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none">
        <path d="M10,50 Q30,30 50,50 T90,50" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <circle cx="10" cy="50" r="2" fill="currentColor"/>
        <circle cx="50" cy="50" r="2" fill="currentColor"/>
        <circle cx="90" cy="50" r="2" fill="currentColor"/>
    </svg>
);

export const SocialVerificationModal: React.FC<SocialVerificationProps> = ({
    isOpen,
    onClose,
    account,
    hasSubmitted,
    setHasSubmitted,
    setVerificationStatus
}) => {
    const [twitterHandle, setTwitterHandle] = useState('');
    const [discordHandle, setDiscordHandle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSocialVerification = async () => {
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }
        
        if (hasSubmitted) {
            toast.error('You have already submitted your handles. Verification is pending.');
            return;
        }

        if (!twitterHandle || !discordHandle) {
            toast.error('Please enter both Twitter and Discord handles');
            return;
        }

        if (!twitterHandle.startsWith('@')) {
            toast.error('Twitter handle must start with @');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await submitSocialHandles(account, twitterHandle, discordHandle);
            if (response.success) {
                setVerificationStatus('pending');
                setHasSubmitted(true);
                toast.success('Social handles submitted for verification');
                onClose();
            }
        } catch (error: any) {
            if (error.response && error.response.data.message === 'Already submitted') {
                toast.error('You have already submitted your handles. Verification is pending.');
                setHasSubmitted(true);
            } else {
                toast.error('Failed to submit social handles');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 backdrop-blur-lg"
        >
            <motion.div className="bg-[#0f172a] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-white/20 relative">
                {/* Enhanced Vector Background Elements */}
                <CircuitPattern className="absolute top-0 right-0 w-64 h-64 text-blue-500/5 transform rotate-45" />
                <CircuitPattern className="absolute bottom-0 left-0 w-64 h-64 text-purple-500/5 transform -rotate-45" />
                <HexagonPattern className="absolute top-1/4 right-0 w-32 h-32 text-white/5" />
                <HexagonPattern className="absolute bottom-1/4 left-0 w-32 h-32 text-white/5" />
                <WavePattern className="absolute top-1/2 left-0 w-full text-white/5" />
                <GlowEffect />

                {/* Enhanced Header with Angular Cut */}
                <div className="relative">
                    <div 
                        className="absolute inset-0 bg-gradient-to-r from-[#0194FC] to-[#300855] transform -skew-y-3"
                    />
                    
                    <div className="relative px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">
                                    Social Verification
                                </h3>
                                <p className="text-sm text-white/70">
                                    Connect your social accounts to continue
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <FaTimes className="text-white" size={16} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Enhanced Body with Geometric Patterns */}
                <div className="relative p-6 space-y-5">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
                    {/* Updated Social Media Links */}
                    <div className="grid grid-cols-2 gap-3 relative">
                        <motion.a
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            href="https://twitter.com/megapayer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1DA1F2]/20 to-[#1DA1F2]/5" />
                            <div className="relative p-4 backdrop-blur-sm border border-[#1DA1F2]/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#1DA1F2]/10 rounded-lg">
                                        <FaTwitter size={20} className="text-[#1DA1F2]" />
                                    </div>
                                    <span className="font-medium text-[#1DA1F2]">Twitter</span>
                                </div>
                            </div>
                        </motion.a>
                        <motion.a
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            href="https://discord.gg/NVqRsTnQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center gap-3 px-4 py-3 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-xl text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-all duration-200"
                        >
                            <FaDiscord size={18} className="shrink-0" />
                            <span className="text-sm font-semibold whitespace-nowrap">Join Discord</span>
                            <FaArrowRight 
                                size={12} 
                                className="ml-auto opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200"
                            />
                        </motion.a>
                    </div>

                    {/* Enhanced Handle Inputs */}
                    <div className="space-y-4 relative">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                                <FaTwitter className="text-[#1DA1F2]" />
                                Twitter Handle
                            </label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0194FC] to-[#300855] rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-lg" />
                                <input
                                    type="text"
                                    value={twitterHandle}
                                    onChange={(e) => setTwitterHandle(e.target.value)}
                                    className="relative w-full px-4 py-4 bg-[#1e293b]/90 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0194FC] text-white placeholder-white/40"
                                    placeholder="@username"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">Discord Handle</label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0194FC] to-[#300855] rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-md"></div>
                                <input
                                    type="text"
                                    value={discordHandle}
                                    onChange={(e) => setDiscordHandle(e.target.value)}
                                    className="relative w-full px-4 py-4 bg-[#1e293b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0194FC] text-white placeholder-white/40"
                                    placeholder="username#0000"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <FaDiscord className="text-[#5865F2]" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Status or Submit Button */}
                    {hasSubmitted ? (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-400/20 via-yellow-400/10 to-yellow-400/5 border border-yellow-400/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <AiOutlineFieldTime className="text-yellow-400 animate-spin" size={24} />
                                <p className="text-yellow-400 font-medium">
                                    Verification in progress...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <VectorButton
                            variant="primary"
                            showGlow
                            onClick={handleSocialVerification}
                            disabled={isSubmitting || !twitterHandle || !discordHandle}
                            className="w-full py-4"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                'Submit for Verification'
                            )}
                        </VectorButton>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SocialVerificationModal;
