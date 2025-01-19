const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = 'CG-2VqLMjUjeLnkxr8TvdhvJsrA';

const COIN_IDS = {
    'MATIC': 'matic-network',
    'BNB': 'binancecoin',
    'AVAX': 'avalanche-2',
};

export const getTokenPrice = async (symbol: string): Promise<number> => {
    try {
        const coinId = COIN_IDS[symbol as keyof typeof COIN_IDS];
        if (!coinId) return 0;

        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data[coinId]?.usd || 0;
    } catch (error) {
        console.error('Error fetching token price:', error);
        return 0;
    }
};

export const convertNativeTokenToUSD = async (
    amount: string,
    symbol: string
): Promise<number> => {
    const price = await getTokenPrice(symbol);
    if (price === 0) {
        console.error(`Failed to get price for ${symbol}`);
        return 0;
    }
    return parseFloat(amount) * price;
};

// Optional: Add price caching to avoid hitting rate limits
let priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 60 * 1000; // 1 minute

export const getCachedTokenPrice = async (symbol: string): Promise<number> => {
    const now = Date.now();
    const cached = priceCache[symbol];

    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.price;
    }

    const price = await getTokenPrice(symbol);
    priceCache[symbol] = { price, timestamp: now };
    return price;
};
