import axios from 'axios';
import { SUPPORTED_NETWORKS } from '../config/networks';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache prices for 30 seconds to avoid rate limits
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

const COIN_GECKO_IDS: { [key: string]: string } = {
    'BNB': 'binancecoin',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'GNF': 'gnf' // Add GNF mapping
};

export const getNativeTokenPrice = async (symbol: string): Promise<number> => {
    // Handle GNF token specially since it might not be on CoinGecko
    if (symbol === 'GNF') {
        return 0.15; // Use a fixed price for GNF, update this as needed
    }

    const coinId = COIN_GECKO_IDS[symbol];
    if (!coinId) {
        throw new Error(`Unsupported token: ${symbol}`);
    }

    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Using cached price for ${symbol}: $${cached.price}`);
        return cached.price;
    }

    try {
        const response = await axios.get(`${COINGECKO_API}/simple/price`, {
            params: {
                ids: coinId,
                vs_currencies: 'usd'
            }
        });

        const price = response.data[coinId].usd;
        console.log(`Fetched new price for ${symbol}: $${price}`);

        // Update cache
        priceCache.set(symbol, {
            price,
            timestamp: Date.now()
        });

        return price;
    } catch (error) {
        console.error(`Error fetching ${symbol} price:`, error);
        throw new Error(`Failed to fetch ${symbol} price`);
    }
};

export const convertNativeTokenToUSD = async (amount: string, symbol: string): Promise<number> => {
    try {
        const price = await getNativeTokenPrice(symbol);
        return parseFloat(amount) * price;
    } catch (error) {
        console.error('Error converting to USD:', error);
        return 0;
    }
};

export const convertUSDToNativeToken = async (usdAmount: number, symbol: string): Promise<string> => {
    try {
        const price = await getNativeTokenPrice(symbol);
        if (price === 0) throw new Error(`Invalid price for ${symbol}`);
        const tokenAmount = usdAmount / price;
        return tokenAmount.toFixed(6);
    } catch (error) {
        console.error('Error converting from USD:', error);
        return '0';
    }
};
