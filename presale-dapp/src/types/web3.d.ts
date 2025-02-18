import { providers } from 'web3';

declare global {
    interface Window {
        ethereum?: providers.Web3Provider;
    }
}

export {};
