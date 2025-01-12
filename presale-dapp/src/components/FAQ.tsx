import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "What is Global Network Foundation?",
        answer: "Global Network Foundation is an innovative blockchain ecosystem that features its own blockchain called Global Network. The ecosystem includes various Web3 solutions including crypto wallets, P2P platform, DEX (decentralized exchange), and Web3 communication applications, all powered by GNF, our native token."
    },
    {
        question: "What are the different token tiers available in the presale?",
        answer: "We offer four token tiers: GNF10, GNF100, GNF1000, and GNF10000. These tokens act as tickets for early investors and can be swapped for our native GNF token at listing time. Each tier comes with unique benefits and different vesting periods. GNF100 is specifically reserved for airdrops and referral rewards."
    },
    {
        question: "How do the presale tokens work?",
        answer: "The presale tokens (GNF10, GNF1000, GNF10000) are deployed on our Global Network blockchain and serve as tickets. At the time of GNF's listing on major exchanges and DEXs, these tokens can be swapped for the native GNF token. This gives our early investors a privileged position in the ecosystem."
    },
    {
        question: "What is GNF100 and how can I earn it?",
        answer: "GNF100 is our reward token that serves two purposes: 1) It's given as an airdrop to investors holding any of our three ticket tokens (GNF10, GNF1000, GNF10000) at the time of listing, 2) It's awarded as commission to users who promote our platform through their referral links."
    },
    {
        question: "Which payment methods are accepted?",
        answer: "We accept payments in USDC, BUSD, and USDT on the ERC20 network (Ethereum blockchain). These stable coins are used to purchase the ticket tokens on our Global Network blockchain."
    },
    {
        question: "How does the referral system work?",
        answer: "Our referral system rewards promoters with GNF100 tokens. When someone purchases tokens through your referral link, you earn a commission in GNF100. This creates a win-win situation for both the referrer and the ecosystem."
    },
    {
        question: "What happens after the token listing?",
        answer: "After GNF is listed on major exchanges and DEXs, holders of our ticket tokens (GNF10, GNF1000, GNF10000) can swap them for the native GNF token. Additionally, eligible holders will receive GNF100 airdrops as a reward for their early support."
    },
    {
        question: "What makes Global Network unique?",
        answer: "Global Network stands out with its comprehensive ecosystem that includes its own blockchain, native token (GNF), crypto wallets, P2P platform, DEX, and Web3 communication applications. This integrated approach ensures a seamless Web3 experience for users across different blockchain services."
    },
    {
        question: "How do I see the tokens I purchase in my wallet?",
        answer: "First, add Global Network Foundation network to your wallet using the 'Add Global Network' button in the footer. Then, import these custom tokens using their contract addresses:\n\n" +
               "• GNF10: 0xAEd556A73beAE48868967ED3755D02fd4a2f62E4\n" +
               "• GNF100: 0x4D15A4239b5A1f6f71eF56345f1c5c54911399F9\n" +
               "• GNF1000: 0x390D5B3A854864CAF342008b61cE4b8b9716bda8\n" +
               "• GNF10000: 0x4C9c0772A58ad89844C7B6Eb701B2E0ED34a9601"
    }
];

const FAQ: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold text-black text-center mb-8">
                Frequently Asked Questions
            </h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <motion.div
                        key={index}
                        initial={false}
                        className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/10"
                    >
                        <motion.button
                            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left"
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        >
                            <span className="text-black font-semibold text-lg">{faq.question}</span>
                            <motion.div
                                animate={{ rotate: activeIndex === index ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <FaChevronDown className="text-black/70" />
                            </motion.div>
                        </motion.button>
                        <AnimatePresence>
                            {activeIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 py-5 border-t border-white/10">
                                        <p className="text-white/80 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
export type { FAQItem };
