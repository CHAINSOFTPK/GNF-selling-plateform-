import React, { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css'; // Import custom toast styles
import Header from './components/Header';
import BuyTokens from './components/BuyTokens';
import ReferralDashboard from './components/ReferralDashboard';
import { Web3Provider } from './context/Web3Context'; // Changed from WalletProvider
import Footer from './components/Footer';
import Admin from "./components/AdminPage";
import Bot from "./components/TelegramBuy";
import Telegramdashboard from "./components/Telegramdashboard"; // Add this import
import TelegramGuide from "./components/TelegramGuide"; // Add this import
import HowToBuy from './components/HowToBuy'; // Add this import
import MobileRedirect from './components/MobileRedirect'; // Add this import
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { mainnet, polygon, avalanche, bsc } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Update GNF Chain configuration
const gnfChain = {
  id: 1013,
  name: 'Global Network',
  network: 'globalnetwork',
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
  iconUrl: '/gnf.png', // Add GNF icon
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

// Update the Polygon Chain configuration
const polygonChain = {
  ...polygon,
  name: 'Polygon',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: {
    public: { http: ['https://polygon-rpc.com'] },
    default: { http: ['https://polygon-rpc.com'] },
  },
  iconUrl: '/polygon.png',
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

const queryClient = new QueryClient();

// Create the Wagmi config outside component
const wagmiConfig = getDefaultConfig({
  appName: 'GNF Presale',
  projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '',
  chains: [bscChain, polygonChain, avalancheChain, gnfChain],
  transports: {
    [bscChain.id]: http(),
    [polygonChain.id]: http(),
    [avalancheChain.id]: http(),
    [gnfChain.id]: http(),
  },
});

// Update this line to use polygonChain as initial
const initialChainId = polygonChain.id;

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <WagmiConfig config={wagmiConfig}>
                <RainbowKitProvider
                    initialChain={initialChainId}
                    theme={darkTheme({
                        accentColor: '#0194FC',
                        borderRadius: 'medium'
                    })}
                    showRecentTransactions={true}
                    coolMode
                >
                    <div className="App">
                        <Routes>
                            {/* Admin Route */}
                            <Route path="/admin" element={<Admin />} />

                            {/* Mobile-specific routes */}
                            <Route path="/bot" element={
                                <Web3Provider><Bot /></Web3Provider>
                            } />
                            <Route path="/telegramdashboard" element={
                                <Web3Provider><Telegramdashboard /></Web3Provider>
                            } />
                            <Route path="/telegramguide" element={
                                <Web3Provider><TelegramGuide /></Web3Provider>
                            } />

                            {/* Desktop routes with shared layout */}
                            <Route element={
                                <Web3Provider>
                                    <div className="min-h-screen bg-gray-100 flex flex-col">
                                        <Header />
                                        <main className="flex-grow container mx-auto px-0 sm:px-4 py-4 sm:py-8 pt-[50px]">
                                            <Outlet />
                                        </main>
                                        <Footer />
                                    </div>
                                </Web3Provider>
                            }>
                                {/* Root path with mobile redirect */}
                                <Route path="/" element={
                                    <MobileRedirect>
                                        <BuyTokens />
                                    </MobileRedirect>
                                } />
                                <Route path="/referrals" element={<ReferralDashboard />} />
                                <Route path="/howtobuy" element={<HowToBuy />} />
                                <Route path="/:walletAddress" element={<BuyTokens />} />
                            </Route>
                        </Routes>

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
                </RainbowKitProvider>
            </WagmiConfig>
        </QueryClientProvider>
    );
};

export default App;
