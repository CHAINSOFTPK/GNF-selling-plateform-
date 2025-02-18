import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/Web3Context';
import { useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlayCircle, FaYoutube, FaFileAlt, FaChevronDown } from 'react-icons/fa';
import TelegramHeader from './TelegramHeader';
import TelegramFooter from './TelegramFooter';
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="w-full max-w-4xl bg-black rounded-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Video Container - Make it larger */}
                <div className="relative aspect-video">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title={video.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                    {/* Close button - Move to top-right corner */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full
                                 hover:bg-black/80 transition-colors"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Minimal info section */}
                <div className="p-4 bg-[#1c1c1c]">
                    <h3 className="text-lg font-medium text-white">{video.title}</h3>
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

const TelegramGuide: React.FC = () => {
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
            <div className="space-y-4">
                {/* Documentation Tab Navigation */}
                <div className="bg-[#1c1c1c] p-1 rounded-lg flex gap-1">
                    <button
                        onClick={() => {
                            setDocTab('quickstart');
                            setCurrentFaqPage(0); // Reset FAQ page when switching tabs
                        }}
                        className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all
                                ${docTab === 'quickstart'
                                    ? 'bg-[#0194FC] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                    >
                        {getTabLabel('quickstart')}
                    </button>
                    <button
                        onClick={() => setDocTab('faqs')}
                        className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all
                                ${docTab === 'faqs'
                                    ? 'bg-[#0194FC] text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                    >
                        {getTabLabel('faqs')}
                    </button>
                </div>

                {/* Content based on selected tab */}
                <div className="space-y-3">
                    {docTab === 'quickstart' ? (
                        // Quick Start Content - Updated to match FAQ style
                        <div className="bg-[#1c1c1c] rounded-xl p-3 border border-gray-800/50">
                            <div className="space-y-1">
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
                                                                className="w-full flex items-center justify-between text-left p-2 
                                                                         hover:bg-gray-800/50 rounded-lg transition-colors"
                                                            >
                                                                <span className="text-[11px] text-white">{line}</span>
                                                                <FaChevronDown 
                                                                    className={`text-gray-400 transform transition-transform ${
                                                                        expandedStep === `step-${i}` ? 'rotate-180' : ''
                                                                    }`}
                                                                    size={12}
                                                                />
                                                            </button>
                                                            
                                                            {expandedStep === `step-${i}` && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="px-2 py-1.5"
                                                                >
                                                                    <div className="space-y-1">
                                                                        {stepContent.map((content: string, j: number) => (
                                                                            <p key={j} className="text-[10px] text-gray-400 pl-4">
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
                        <div className="bg-[#1c1c1c] rounded-xl p-3 border border-gray-800/50">
                            <div className="space-y-1">
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
                                                                className="w-full flex items-center justify-between text-left p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                                                            >
                                                                <span className="text-[11px] text-white">{faq.question}</span>
                                                                <FaChevronDown 
                                                                    className={`text-gray-400 transform transition-transform ${
                                                                        expandedFaq === `faq-${i}` ? 'rotate-180' : ''
                                                                    }`}
                                                                    size={12}
                                                                />
                                                            </button>
                                                            
                                                            {expandedFaq === `faq-${i}` && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="px-2 py-1.5 text-[10px] text-gray-400"
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
            <div className="p-2">
                <h3 className="text-sm font-medium text-white mb-1">
                    {video.title}
                </h3>
                <p className="text-[11px] text-gray-400 line-clamp-2">
                    {video.description}
                </p>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen relative overflow-hidden pb-16">
            {/* Vector Background */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/bg.png")' }}
            />

            {/* Main Content - Add relative positioning and z-index */}
            <div className="relative z-10">
                <TelegramHeader
                    account={account}
                    chainId={chainId}
                    onConnect={connectWallet}
                    onNetworkSwitch={handleNetworkSwitch}
                />

                {/* Improved Navigation */}
                <div className="sticky top-[60px] z-30 bg-[#0f172a]/95 backdrop-blur-sm border-b border-gray-800/50">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Language Selector - Now a dropdown */}
                            <div className="relative flex-1">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                                    className="w-full appearance-none bg-[#1c1c1c] text-white text-sm 
                                             px-3 py-2 rounded-lg border border-gray-800 focus:border-[#0194FC]
                                             focus:outline-none"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tab Navigation - Now with translations */}
                            <div className="flex bg-[#1c1c1c] p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('videos')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all
                                            ${activeTab === 'videos'
                                                ? 'bg-[#0194FC] text-white'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                >
                                    {navigationText.videos}
                                </button>
                                <button
                                    onClick={() => setActiveTab('docs')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all
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

                {/* Main Content */}
                <div className="px-4 py-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'videos' ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Video Grid - 2 columns with better spacing and hover effects */}
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredVideos.map((video) => renderVideoCard(video))}
                                </div>
                                
                                {/* No Videos Message */}
                                {currentVideos.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">
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
                                className="space-y-4"
                            >
                                {renderDocumentation()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Video Modal with AnimatePresence */}
                <AnimatePresence>
                    {selectedVideo && (
                        <VideoModal
                            video={selectedVideo}
                            isOpen={!!selectedVideo}
                            onClose={() => setSelectedVideo(null)}
                        />
                    )}
                </AnimatePresence>

                <TelegramFooter 
                    onMenuClick={handleFooterMenuClick}
                    currentPage="guide"
                    navigationText={{
                        guide: navigationText.guide,
                        dashboard: navigationText.dashboard,
                        buy: navigationText.buy
                    }}
                />
            </div>
        </div>
    );
};

export default TelegramGuide;
