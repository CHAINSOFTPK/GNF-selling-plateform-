import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/Web3Context';
import { useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlayCircle, FaYoutube, FaFileAlt, FaChevronDown } from 'react-icons/fa';
import Header from './Header'; // Changed from TelegramHeader
import Footer from './Footer'; // Changed from TelegramFooter
import { switchToNetwork } from '../utils/network';
import tutorialData from '../data/telegramGuide/tutorials.json';
import { VideoTutorial, DocumentationItem, TutorialData, FAQ, NavigationText } from '../types/tutorials';

// Force the type assertion through unknown
const typedTutorialData = (tutorialData as unknown) as TutorialData;

interface VideoModalProps {
    video: VideoTutorial | null;
    isOpen: boolean;
    onClose: () => void;
}

// Update VideoModal for better video display
const VideoModal: React.FC<VideoModalProps> = ({ video, isOpen, onClose }) => {
    if (!video || !isOpen) return null;

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(video.youtubeUrl);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="relative w-full max-w-5xl rounded-2xl overflow-hidden bg-gradient-to-b from-[#1c1c1c] to-[#0f172a] border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button - Redesigned */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 
                             rounded-full transition-all duration-200 group border border-white/10"
                >
                    <svg 
                        className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" 
                        />
                    </svg>
                </button>

                {/* Video Container - Enhanced */}
                <div className="relative aspect-video bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={video.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Video Info Section - Enhanced */}
                <div className="p-6 bg-gradient-to-r from-[#1c1c1c] to-[#0f172a]">
                    <h3 className="text-xl font-medium text-white mb-2">
                        {video.title}
                    </h3>
                    <p className="text-white/60 text-sm">
                        {video.description}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Add thumbnail fallback component
const VideoThumbnail: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [error, setError] = useState(false);
    
    return (
        <div className="aspect-video bg-[#1c1c1c] relative overflow-hidden">
            {!error ? (
                <img 
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#151515]">
                    <div className="text-[#0194FC] text-4xl">GNF</div>
                </div>
            )}
        </div>
    );
};

const HowToBuy: React.FC = () => {
    const navigate = useNavigate();
    const { account, connectWallet } = useWallet();
    const chainId = useChainId();
    const [activeTab, setActiveTab] = useState<'videos' | 'docs'>('videos');
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'uz' | 'tr' | 'ru'>('en');
    const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [docTab, setDocTab] = useState<'quickstart' | 'faqs'>('quickstart');
    const [currentFaqPage, setCurrentFaqPage] = useState(0);
    const FAQS_PER_PAGE = 5;

    // Add state for expanded quick start step
    const [expandedStep, setExpandedStep] = useState<string | null>(null);

    // Network switch handler
    const handleNetworkSwitch = async (targetChainId: number) => {
        try {
            await switchToNetwork(targetChainId);
        } catch (error) {
            console.error('Failed to switch network:', error);
        }
    };

    // Handle video click to open in new tab
    const handleVideoClick = (url: string) => {
        window.open(url, '_blank');
    };

    // Handle footer menu clicks
    const handleFooterMenuClick = (action: 'buy' | 'dashboard' | 'guide') => {
        switch(action) {
            case 'buy':
                navigate('/bot');
                break;
            case 'dashboard':
                navigate('/telegramdashboard');
                break;
            case 'guide':
                // Already on guide page
                break;
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'uz', name: 'Uzbek' },
        { code: 'tr', name: 'Turkish' },
        { code: 'ru', name: 'Russian' }
    ] as const;

    // Get videos for current language with proper typing
    const currentVideos = typedTutorialData.videos[selectedLanguage] || [];
    
    // Get documentation for current language with proper typing
    const currentDocs = (typedTutorialData.documentation[selectedLanguage] && 
                      typedTutorialData.documentation[selectedLanguage].length > 0)
                   ? typedTutorialData.documentation[selectedLanguage]
                   : typedTutorialData.documentation.en;

    // Get current language navigation text
    const navigationText: NavigationText = typedTutorialData.navigation[selectedLanguage];

    // Add this helper function at the top of the file
    const takeUntil = (arr: string[], predicate: (item: string) => boolean): string[] => {
        const result = [];
        for (const item of arr) {
            if (predicate(item)) break;
            result.push(item);
        }
        return result;
    };

    // Update the isStepLine function to better handle Uzbek steps
    function isStepLine(line: string) {
        const stepKeywords = ['Step', 'Шаг', 'Adım', 'qadam', '1-qadam', '2-qadam', '3-qadam', '4-qadam', '5-qadam'];
        return stepKeywords.some(keyword => 
            line.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    // Update the documentation render logic to properly handle empty content
    const renderDocumentation = () => {
        // Get current docs but fallback to English if selected language content is empty
        const docs = (typedTutorialData.documentation[selectedLanguage] && 
                     typedTutorialData.documentation[selectedLanguage].length > 0)
                    ? typedTutorialData.documentation[selectedLanguage]
                    : typedTutorialData.documentation.en;

        // Get labels based on language
        const getTabLabel = (tab: 'quickstart' | 'faqs') => {
            if (selectedLanguage === 'uz') {
                return tab === 'quickstart' ? "Qo'llanma" : "Ko'p so'raladigan savollar";
            }
            return tab === 'quickstart' ? 'Quick Start' : 'FAQs';
        };

        return (
            <div className="space-y-6"> {/* Increased spacing */}
                {/* Documentation Tab Navigation */}
                <div className="bg-[#1c1c1c] p-2 rounded-lg flex gap-2"> {/* Increased padding and gap */}
                    <button
                        onClick={() => {
                            setDocTab('quickstart');
                            setCurrentFaqPage(0); // Reset FAQ page when switching tabs
                        }}
                        className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all
                                ${docTab === 'quickstart'
                                    ? 'bg-[#0194FC] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                    >
                        {getTabLabel('quickstart')}
                    </button>
                    <button
                        onClick={() => setDocTab('faqs')}
                        className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all
                                ${docTab === 'faqs'
                                    ? 'bg-[#0194FC] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                    >
                        {getTabLabel('faqs')}
                    </button>
                </div>

                {/* Content based on selected tab */}
                <div className="space-y-4"> {/* Increased spacing */}
                    {docTab === 'quickstart' ? (
                        // Quick Start Content - Updated to match FAQ style
                        <div className="bg-[#1c1c1c] rounded-xl p-4 border border-gray-800/50"> {/* Increased padding */}
                            <div className="space-y-2"> {/* Increased spacing */}
                                {docs
                                    .filter(doc => doc.type === 'guide')
                                    .map((doc: DocumentationItem, index: number) => (
                                        <div key={index}>
                                            {/* Steps as collapsible sections */}
                                            {(doc.content as string[]).map((line: string, i: number) => {
                                                if (isStepLine(line)) {
                                                    const stepContent = takeUntil(
                                                        (doc.content as string[]).slice(i + 1),
                                                        (l: string) => isStepLine(l)
                                                    );
                                                    
                                                    return (
                                                        <div key={i} className="border-b border-gray-800/50 last:border-0">
                                                            <button
                                                                onClick={() => setExpandedStep(
                                                                    expandedStep === `step-${i}` ? null : `step-${i}`
                                                                )}
                                                                className="w-full flex items-center justify-between text-left p-3 
                                                                         hover:bg-gray-800/50 rounded-lg transition-colors"
                                                            >
                                                                <span className="text-base text-white">{line}</span>
                                                                <FaChevronDown 
                                                                    className={`text-gray-400 transform transition-transform ${
                                                                        expandedStep === `step-${i}` ? 'rotate-180' : ''
                                                                    }`}
                                                                    size={16}
                                                                />
                                                            </button>
                                                            
                                                            {expandedStep === `step-${i}` && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="px-4 py-3" // Increased padding
                                                                >
                                                                    <div className="space-y-2"> {/* Increased spacing */}
                                                                        {stepContent.map((content: string, j: number) => (
                                                                            <p key={j} className="text-sm text-gray-400 pl-4">
                                                                                {content}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        // FAQs Content with Pagination
                        <div className="bg-[#1c1c1c] rounded-xl p-4 border border-gray-800/50"> {/* Increased padding */}
                            <div className="space-y-2"> {/* Increased spacing */}
                                {currentDocs
                                    .filter(doc => doc.type === 'faq')
                                    .map((doc: DocumentationItem) => {
                                        const faqs = doc.content as FAQ[];
                                        const totalPages = Math.ceil(faqs.length / FAQS_PER_PAGE);
                                        const currentFaqs = faqs.slice(
                                            currentFaqPage * FAQS_PER_PAGE,
                                            (currentFaqPage + 1) * FAQS_PER_PAGE
                                        );

                                        return (
                                            <>
                                                <div className="space-y-1">
                                                    {currentFaqs.map((faq: FAQ, i: number) => (
                                                        <div key={i} className="border-b border-gray-800/50 last:border-0">
                                                            <button
                                                                onClick={() => setExpandedFaq(expandedFaq === `faq-${i}` ? null : `faq-${i}`)}
                                                                className="w-full flex items-center justify-between text-left p-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                                                            >
                                                                <span className="text-base text-white">{faq.question}</span>
                                                                <FaChevronDown 
                                                                    className={`text-gray-400 transform transition-transform ${
                                                                        expandedFaq === `faq-${i}` ? 'rotate-180' : ''
                                                                    }`}
                                                                    size={16}
                                                                />
                                                            </button>
                                                            
                                                            {expandedFaq === `faq-${i}` && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="px-4 py-3 text-sm text-gray-400" // Increased padding and font size
                                                                >
                                                                    {faq.answer}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Pagination Controls */}
                                                {totalPages > 1 && (
                                                    <div className="flex items-center justify-center gap-2 mt-4 pt-2 border-t border-gray-800/50">
                                                        <button
                                                            onClick={() => setCurrentFaqPage(prev => Math.max(0, prev - 1))}
                                                            disabled={currentFaqPage === 0}
                                                            className="p-1 text-[#0194FC] disabled:text-gray-600"
                                                        >
                                                            <FaChevronDown className="transform rotate-90" size={14} />
                                                        </button>
                                                        <span className="text-[10px] text-gray-400">
                                                            Page {currentFaqPage + 1} of {totalPages}
                                                        </span>
                                                        <button
                                                            onClick={() => setCurrentFaqPage(prev => Math.min(totalPages - 1, prev + 1))}
                                                            disabled={currentFaqPage === totalPages - 1}
                                                            className="p-1 text-[#0194FC] disabled:text-gray-600"
                                                        >
                                                            <FaChevronDown className="transform -rotate-90" size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Filter videos by language and category
    const filteredVideos = currentVideos;

    // Update the video card rendering to remove category badge
    const renderVideoCard = (video: VideoTutorial) => (
        <motion.div
            key={video.id}
            layout
            className="group bg-[#1c1c1c] rounded-lg overflow-hidden border border-gray-800/50
                     hover:border-[#0194FC]/50 transition-all cursor-pointer
                     transform hover:scale-[1.02] hover:shadow-xl"
            onClick={() => setSelectedVideo(video)}
        >
            <div className="relative">
                <VideoThumbnail 
                    src={video.thumbnail}
                    alt={video.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#0194FC] rounded-full flex items-center justify-center
                                  transform group-hover:scale-110 transition-all
                                  shadow-lg group-hover:shadow-[#0194FC]/20">
                        <FaPlayCircle className="text-white text-xl" />
                    </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 
                              rounded text-[10px] text-white font-medium">
                    {video.duration}
                </div>
            </div>
            <div className="p-4"> {/* Increased padding */}
                <h3 className="text-lg font-medium text-white mb-2"> {/* Increased text size and margin */}
                    {video.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2"> {/* Increased text size */}
                    {video.description}
                </p>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen relative overflow-hidden pb-16">
            {/* Background Image - Added to match BuyTokens */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/bg.png")' }}
            />

            {/* Main Content - Updated styling */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 mt-20 mb-8">
                {/* Enhanced Navigation Container */}
                <div className="max-w-3xl mx-auto mb-8">
                    <div className="bg-[#0f172a]/90 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden">
                        {/* Vector Background Pattern */}
                        <div className="absolute inset-0">
                            <svg className="w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path
                                    d="M0,0 L100,0 L90,100 L10,100 Z"
                                    fill="url(#grad)"
                                />
                                <defs>
                                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" style={{ stopColor: '#0194FC' }} />
                                        <stop offset="100%" style={{ stopColor: '#300855' }} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Language and Tab Navigation - Enhanced */}
                        <div className="flex items-center justify-between gap-6 relative z-10">
                            {/* Language Selector - Enhanced */}
                            <div className="relative w-48">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                                    className="w-full appearance-none bg-[#1c1c1c] text-white text-sm 
                                             px-4 py-2.5 rounded-lg border border-gray-800 focus:border-[#0194FC]
                                             focus:outline-none cursor-pointer"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tab Navigation - Enhanced */}
                            <div className="flex bg-[#1c1c1c] p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('videos')}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all
                                            ${activeTab === 'videos'
                                                ? 'bg-[#0194FC] text-white'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                >
                                    {navigationText.videos}
                                </button>
                                <button
                                    onClick={() => setActiveTab('docs')}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all
                                            ${activeTab === 'docs'
                                                ? 'bg-[#0194FC] text-white'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                >
                                    {navigationText.docs}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area - Enhanced with gradient border */}
                <div className="max-w-3xl mx-auto relative">
                    {/* Gradient Border Effect */}
                    <div className="absolute -inset-1">
                        <div className="w-full h-full bg-gradient-to-r from-[#0194FC] to-[#300855] opacity-50 blur-lg" />
                    </div>

                    {/* Main Content Container */}
                    <div className="relative bg-[#1c1c1c]/90 rounded-xl backdrop-blur-sm border border-white/10 p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'videos' ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {/* Video Grid - Updated for desktop */}
                                    <div className="grid grid-cols-2 gap-6"> {/* Increased gap */}
                                        {filteredVideos.map((video) => renderVideoCard(video))}
                                    </div>
                                    
                                    {/* No Videos Message - Enhanced for desktop */}
                                    {currentVideos.length === 0 && (
                                        <div className="text-center py-12 bg-[#1c1c1c] rounded-xl border border-gray-800/50">
                                            <p className="text-gray-400 text-base">
                                                {navigationText.noVideos}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6" // Increased spacing
                                >
                                    {renderDocumentation()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <VideoModal
                        video={selectedVideo}
                        isOpen={!!selectedVideo}
                        onClose={() => setSelectedVideo(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default HowToBuy;
