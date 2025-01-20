import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';
import Header from './components/Header';
import BuyTokens from './components/BuyTokens';
import ReferralDashboard from './components/ReferralDashboard';
import { Web3Provider } from './context/Web3Context'; // Changed from WalletProvider
import Footer from './components/Footer';
import Admin from "./components/AdminPage";
import Bot from "./components/TelegramBuy";

import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { mainnet, polygon, avalanche, bsc } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Define GNF Chain
const gnfChain = {
  id: 1013,
  name: 'Global Network',
  nativeCurrency: {
    decimals: 18,
    name: 'GNF',
    symbol: 'GNF',
  },
  rpcUrls: {
    public: { http: ['https://evm.globalnetwork.foundation'] },
    default: { http: ['https://evm.globalnetwork.foundation'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.globalnetwork.foundation' },
  },
} as const;

// Define Shopelia Testnet
const shopeliaTestnet = {
  id: 2010,
  name: 'Shopelia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SHOP',
    symbol: 'SHOP',
  },
  rpcUrls: {
    public: { http: ['https://rpc.shopelia.io/testnet'] },
    default: { http: ['https://rpc.shopelia.io/testnet'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.shopelia.io/testnet' },
  },
  testnet: true,
} as const;

// Define BSC Chain
const bscChain = {
  ...bsc,
  rpcUrls: {
    public: { http: ['https://bsc-dataseed.binance.org'] },
    default: { http: ['https://bsc-dataseed.binance.org'] },
  },
  iconUrl: '/bnb.png', // Add icon
  testnet: false
};

// Define Polygon Chain
const polygonChain = {
  ...polygon,
  rpcUrls: {
    public: { http: ['https://polygon-rpc.com'] },
    default: { http: ['https://polygon-rpc.com'] },
  },
  iconUrl: '/polygon.png', // Add icon
  testnet: false
};

// Define Avalanche Chain
const avalancheChain = {
  ...avalanche,
  rpcUrls: {
    public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
  },
  iconUrl: '/avax.png', // Add icon
  testnet: false
};

// Add this check at the start of your component
const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('REACT_APP_WALLET_CONNECT_PROJECT_ID is not defined');
}

const config = getDefaultConfig({
  appName: 'GNF Presale',
  projectId,
  chains: [bscChain, polygonChain, avalancheChain],
  transports: {
    [bscChain.id]: http(),
    [polygonChain.id]: http(),
    [avalancheChain.id]: http(),
  },
});

// Add this to set initial chain
const initialChainId = bscChain.id;

const queryClient = new QueryClient();

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <WagmiConfig config={config}>
                <RainbowKitProvider
                    initialChain={initialChainId}  // Set initial chain here
                    theme={darkTheme({
                        accentColor: '#0194FC',
                        borderRadius: 'medium'
                    })}
                    showRecentTransactions={true}
                    coolMode
                >
                    <BrowserRouter>
                        <Routes>
                            {/* Admin Routes */}
                            <Route path="/admin" element={<Admin />} />
                            
                            {/* User Routes wrapped with Web3Provider */}
                            <Route
                                path="/*"
                                element={
                                    <Web3Provider>
                                        <div className="min-h-screen bg-gray-100 flex flex-col">
                                            <Header />
                                            <main className="flex-grow container mx-auto px-0 sm:px-4 py-4 sm:py-8 pt-[50px]">
                                                <Routes>
                                                    <Route path="/" element={<BuyTokens />} />
                                                    <Route path="/referrals" element={<ReferralDashboard />} />
                                                    <Route path="/:walletAddress" element={<BuyTokens />} />
                                                    <Route path="/bot" element={<Bot />} />
                                                </Routes>
                                            </main>
                                            <Footer />
                                            <ToastContainer
                                                position="top-right"
                                                autoClose={4000}
                                                hideProgressBar={false}
                                                newestOnTop
                                                closeOnClick
                                                rtl={false}
                                                pauseOnFocusLoss
                                                draggable
                                                pauseOnHover
                                                theme="colored"
                                                transition={Slide}
                                                className="toast-container !p-4 sm:!p-6"
                                                toastClassName="toast-item text-sm sm:text-base"
                                                progressClassName="toast-progress"
                                                limit={3}
                                            />
                                        </div>
                                    </Web3Provider>
                                }
                            />
                            <Route
                                path="/bot"
                                element={
                                    <Web3Provider>
                                        {/* Remove parent header and footer for the /bot route */}
                                        <Bot />
                                    </Web3Provider>
                                }
                            />
                        </Routes>
                    </BrowserRouter>
                </RainbowKitProvider>
            </WagmiConfig>
        </QueryClientProvider>
    );
};

export default App;
