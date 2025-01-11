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

const App: React.FC = () => {
    return (
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
                                <main className="flex-grow container mx-auto px-0 sm:px-4 py-4 sm:py-8">
                                    <Routes>
                                        <Route path="/" element={<BuyTokens />} />
                                        <Route path="/referrals" element={<ReferralDashboard />} />
                                        <Route path="/:walletAddress" element={<BuyTokens />} />
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
            </Routes>
        </BrowserRouter>
    );
};

export default App;
