type SupportedCrypto = "BTC" | "ETH" | "USDT" | "USDC" | "XMR" | "LTC";

interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}

// ==================== CONFIG ====================

const CACHE_TTL = 60 * 1000; // 1 minute
const cache = new Map<SupportedCrypto, ExchangeRateCache>();

const COINGECKO_IDS: Record<SupportedCrypto, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  XMR: "monero",
  LTC: "litecoin",
};

// ==================== HELPERS ====================

const getCachedRate = (crypto: SupportedCrypto): number | null => {
  const entry = cache.get(crypto);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(crypto);
    return null;
  }

  return entry.rate;
};

const setCache = (crypto: SupportedCrypto, rate: number) => {
  cache.set(crypto, {
    rate,
    timestamp: Date.now(),
  });
};

// ==================== CORE ====================

/**
 * Get real-time crypto exchange rate (USD)
 */
export async function getCryptoExchangeRate(
  cryptocurrency: SupportedCrypto,
): Promise<number> {
  try {
    // ✅ Check cache first (VERY IMPORTANT)
    const cached = getCachedRate(cryptocurrency);
    if (cached) return cached;

    const coinId = COINGECKO_IDS[cryptocurrency];

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from CoinGecko");
    }

    const data = await response.json();

    const rate = data?.[coinId]?.usd;

    if (!rate || typeof rate !== "number") {
      throw new Error("Invalid rate data");
    }

    // ✅ Cache result
    setCache(cryptocurrency, rate);

    return rate;
  } catch (error) {
    console.error("Exchange rate error:", error);

    // 🔁 Fallback (VERY IMPORTANT)
    const fallbackRates: Record<SupportedCrypto, number> = {
      BTC: 40000,
      ETH: 2000,
      USDT: 1,
      USDC: 1,
      XMR: 150,
      LTC: 70,
    };

    return fallbackRates[cryptocurrency];
  }
}

/**
 * Convert USD → Crypto
 */
export function calculateCryptoAmount(
  usdAmount: number,
  exchangeRate: number,
): number {
  if (!usdAmount || usdAmount <= 0) {
    throw new Error("Invalid USD amount");
  }

  if (!exchangeRate || exchangeRate <= 0) {
    throw new Error("Invalid exchange rate");
  }

  // 🔥 High precision handling
  return Number((usdAmount / exchangeRate).toFixed(8));
}

/**
 * Required blockchain confirmations
 */
export function getRequiredConfirmations(crypto: SupportedCrypto): number {
  const confirmations: Record<SupportedCrypto, number> = {
    BTC: 3,
    ETH: 12,
    USDT: 12,
    USDC: 12,
    XMR: 10,
    LTC: 6,
  };

  return confirmations[crypto];
}

/**
 * Get vendor wallet address
 * ⚠️ In production, fetch from DB or wallet service
 */
export async function getVendorWalletAddress(
  vendorId: string,
  crypto: SupportedCrypto,
): Promise<string> {
  if (!vendorId) {
    throw new Error("Vendor ID required");
  }

  // 🔥 Simulated DB lookup (replace this)
  const wallets: Record<SupportedCrypto, string> = {
    BTC: "bc1qexample...",
    ETH: "0xexample...",
    USDT: "0xexample...",
    USDC: "0xexample...",
    XMR: "4example...",
    LTC: "ltc1example...",
  };

  const wallet = wallets[crypto];

  if (!wallet) {
    throw new Error(`Wallet not found for ${crypto}`);
  }

  return wallet;
}
